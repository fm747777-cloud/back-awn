import React, { useState, useMemo, useEffect, useRef } from 'react';
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
} from 'recharts';
import {
    Ticket,
    Sparkles,
    FolderOpen,
    Clock,
    CheckCircle2,
    Archive,
    Tag,
    AlertCircle,
    Calendar,
    Building2,
} from 'lucide-react';
import {
    loadTickets,
    loadTicketTypes,
    normalizeTicketStatus,
    TICKET_STATUS_OPTIONS,
    type TableTicket,
    type TicketLifecycleStatus,
} from './ticketingMockData';

function parseTicketYearMonth(dateStr?: string): string | null {
    if (!dateStr) return null;
    const trimmed = dateStr.trim();
    const match = trimmed.match(/^(\d{4})-(\d{2})/);
    if (match) {
        return `${match[1]}-${match[2]}`;
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
        const yyyy = parsed.getFullYear();
        const mm = String(parsed.getMonth() + 1).padStart(2, '0');
        return `${yyyy}-${mm}`;
    }
    return null;
}

function useChartContainerWidth(defaultWidth = 520) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [width, setWidth] = useState<number>(defaultWidth);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const updateWidth = () => {
            const nextWidth = Math.round(el.getBoundingClientRect().width);
            if (nextWidth > 0) {
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

    return [ref, width] as const;
}

export const TicketingDashboardPage = () => {
    const { t, i18n } = useTranslation();
    const isAr = i18n.language?.startsWith('ar');

    const [statusChartRef, statusChartWidth] = useChartContainerWidth(520);
    const [monthlyChartRef, monthlyChartWidth] = useChartContainerWidth(920);

    const [tickets, setTickets] = useState<TableTicket[]>(() => loadTickets());
    const [ticketTypes, setTicketTypes] = useState(() => loadTicketTypes());

    useEffect(() => {
        const refresh = () => {
            setTickets(loadTickets());
            setTicketTypes(loadTicketTypes());
        };
        refresh();
        window.addEventListener('focus', refresh);
        window.addEventListener('storage', refresh);
        return () => {
            window.removeEventListener('focus', refresh);
            window.removeEventListener('storage', refresh);
        };
    }, []);

    // Dynamically derived current month/year label
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

    // --- KPI Counts Derived From Persisted Tickets ---
    const statusCounts = useMemo(() => {
        const counts: Record<TicketLifecycleStatus, number> = {
            NEW: 0,
            OPEN: 0,
            'IN PROGRESS': 0,
            SOLVED: 0,
            CLOSED: 0,
        };
        for (const ticket of tickets) {
            const st = normalizeTicketStatus(ticket);
            counts[st] = (counts[st] || 0) + 1;
        }
        return counts;
    }, [tickets]);

    const totalTickets = tickets.length;
    const safePct = (count: number) =>
        totalTickets > 0 ? ((count / totalTickets) * 100).toFixed(1) : '0.0';

    // --- 1. Tickets by Status ---
    const statusBreakdown = useMemo(() => {
        const meta: Record<
            TicketLifecycleStatus,
            { label: string; color: string; bgClass: string }
        > = {
            NEW: {
                label: t('ticketing.statuses.new'),
                color: '#2D3F2C',
                bgClass: 'bg-[#2D3F2C]',
            },
            OPEN: {
                label: t('ticketing.statuses.open'),
                color: '#265938',
                bgClass: 'bg-[#265938]',
            },
            'IN PROGRESS': {
                label: t('ticketing.statuses.inProgress'),
                color: '#8C6046',
                bgClass: 'bg-[#8C6046]',
            },
            SOLVED: {
                label: t('ticketing.statuses.solved'),
                color: '#6A7358',
                bgClass: 'bg-[#6A7358]',
            },
            CLOSED: {
                label: t('ticketing.statuses.closed'),
                color: '#857E74',
                bgClass: 'bg-[#857E74]',
            },
        };

        return TICKET_STATUS_OPTIONS.map((st) => ({
            status: st,
            name: meta[st].label,
            count: statusCounts[st],
            percent: safePct(statusCounts[st]),
            color: meta[st].color,
            bgClass: meta[st].bgClass,
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusCounts, totalTickets, t]);

    // --- 2. Tickets by Priority ---
    const priorityData = useMemo(() => {
        let high = 0;
        let medium = 0;
        let low = 0;
        for (const ticket of tickets) {
            if (ticket.priority === 'High') high += 1;
            else if (ticket.priority === 'Medium') medium += 1;
            else low += 1;
        }
        return [
            {
                key: 'High',
                name: t('ticketing.priorities.high'),
                value: high,
                percent: safePct(high),
                color: '#8C6046',
            },
            {
                key: 'Medium',
                name: t('ticketing.priorities.medium'),
                value: medium,
                percent: safePct(medium),
                color: '#2D3F2C',
            },
            {
                key: 'Low',
                name: t('ticketing.priorities.low'),
                value: low,
                percent: safePct(low),
                color: '#BFAB93',
            },
        ];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tickets, totalTickets, t]);

    // --- 3. Tickets by Type ---
    const typeData = useMemo(() => {
        const map = new Map<string, { en: string; ar: string; count: number }>();

        // Seed known active ticket types so their localized names match
        for (const tt of ticketTypes) {
            map.set(tt.name.toLowerCase(), {
                en: tt.name,
                ar: tt.nameAr || tt.name,
                count: 0,
            });
        }

        for (const ticket of tickets) {
            const keyEn = (ticket.ticketTypeEn || ticket.ticketType || 'Other').trim();
            const keyLower = keyEn.toLowerCase();
            const existing = map.get(keyLower);
            if (existing) {
                existing.count += 1;
            } else {
                // Also check if ticket matches by Arabic name
                let matchedByAr = false;
                for (const entry of map.values()) {
                    if (
                        entry.ar === ticket.ticketType ||
                        entry.ar === ticket.ticketTypeEn
                    ) {
                        entry.count += 1;
                        matchedByAr = true;
                        break;
                    }
                }
                if (!matchedByAr) {
                    map.set(keyLower, {
                        en: ticket.ticketTypeEn || ticket.ticketType || 'Unclassified',
                        ar: ticket.ticketType || ticket.ticketTypeEn || 'غير مصنف',
                        count: 1,
                    });
                }
            }
        }

        return Array.from(map.values())
            .filter((item) => item.count > 0)
            .sort((a, b) => b.count - a.count)
            .map((item) => ({
                name: isAr ? item.ar : item.en,
                count: item.count,
                percent: safePct(item.count),
            }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tickets, ticketTypes, isAr, totalTickets]);

    // --- 4. Monthly Trend (Trailing 6 Months Ending at Current Date + Actual Ticket Timestamps) ---
    const monthlyTrendData = useMemo(() => {
        const now = new Date();
        const buckets: Array<{
            ym: string;
            name: string;
            total: number;
            openCount: number;
            closedCount: number;
        }> = [];

        for (let offset = 5; offset >= 0; offset -= 1) {
            const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const ym = `${yyyy}-${mm}`;
            let label = ym;
            try {
                label = new Intl.DateTimeFormat(
                    isAr ? 'ar-SA-u-ca-gregory' : 'en-US',
                    {
                        month: 'short',
                        year: 'numeric',
                    }
                ).format(d);
            } catch {
                // Fallback to YYYY-MM
            }
            buckets.push({
                ym,
                name: label,
                total: 0,
                openCount: 0,
                closedCount: 0,
            });
        }

        const bucketMap = new Map(buckets.map((b) => [b.ym, b]));

        for (const ticket of tickets) {
            const ym = parseTicketYearMonth(ticket.createdDate);
            if (!ym) continue;
            const bucket = bucketMap.get(ym);
            if (bucket) {
                bucket.total += 1;
                const st = normalizeTicketStatus(ticket);
                if (st === 'CLOSED' || st === 'SOLVED') {
                    bucket.closedCount += 1;
                } else {
                    bucket.openCount += 1;
                }
            }
        }

        return buckets.map((b) => ({
            name: b.name,
            [t('ticketing.labels.totalTickets')]: b.total,
            [t('ticketing.statuses.open')]: b.openCount,
            [t('ticketing.statuses.closed')]: b.closedCount,
            total: b.total,
        }));
    }, [tickets, isAr, t]);

    // --- 5. Tickets by Company ---
    const companyData = useMemo(() => {
        const map: Record<string, { ar: string; en: string; count: number }> = {};
        tickets.forEach((ticket) => {
            const key = ticket.companyEn || ticket.company;
            if (!map[key]) {
                map[key] = {
                    ar: ticket.company || ticket.companyEn,
                    en: ticket.companyEn || ticket.company,
                    count: 0,
                };
            }
            map[key].count += 1;
        });
        return Object.values(map)
            .sort((a, b) => b.count - a.count)
            .map((item) => ({
                name: isAr ? item.ar : item.en,
                count: item.count,
                percent: safePct(item.count),
            }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tickets, isAr, totalTickets]);

    const kpiCards = [
        {
            key: 'total',
            title: t('ticketing.dashboard.kpis.totalTickets'),
            desc: t('ticketing.dashboard.kpis.totalTicketsDesc'),
            count: totalTickets,
            percent: '100%',
            icon: Ticket,
            accentClass: 'bg-[#2D3F2C]/10 border-[#2D3F2C]/20 text-[#2D3F2C]',
            badgeClass: 'bg-[#2D3F2C]/10 text-[#2D3F2C]',
        },
        {
            key: 'new',
            title: t('ticketing.statuses.new'),
            desc: t('ticketing.dashboard.kpis.newTicketsDesc'),
            count: statusCounts.NEW,
            percent: `${safePct(statusCounts.NEW)}%`,
            icon: Sparkles,
            accentClass: 'bg-[#2D3F2C]/10 border-[#2D3F2C]/20 text-[#2D3F2C]',
            badgeClass: 'bg-[#2D3F2C]/10 text-[#2D3F2C]',
        },
        {
            key: 'open',
            title: t('ticketing.statuses.open'),
            desc: t('ticketing.kpis.openTicketsDesc'),
            count: statusCounts.OPEN,
            percent: `${safePct(statusCounts.OPEN)}%`,
            icon: FolderOpen,
            accentClass: 'bg-[#265938]/10 border-[#265938]/20 text-[#265938]',
            badgeClass: 'bg-[#265938]/10 text-[#265938]',
        },
        {
            key: 'inProgress',
            title: t('ticketing.statuses.inProgress'),
            desc: t('ticketing.dashboard.kpis.inProgressTicketsDesc'),
            count: statusCounts['IN PROGRESS'],
            percent: `${safePct(statusCounts['IN PROGRESS'])}%`,
            icon: Clock,
            accentClass: 'bg-[#8C6046]/10 border-[#8C6046]/20 text-[#8C6046]',
            badgeClass: 'bg-[#8C6046]/10 text-[#8C6046]',
        },
        {
            key: 'solved',
            title: t('ticketing.statuses.solved'),
            desc: t('ticketing.dashboard.kpis.solvedTicketsDesc'),
            count: statusCounts.SOLVED,
            percent: `${safePct(statusCounts.SOLVED)}%`,
            icon: CheckCircle2,
            accentClass: 'bg-[#6A7358]/10 border-[#6A7358]/20 text-[#6A7358]',
            badgeClass: 'bg-[#6A7358]/10 text-[#6A7358]',
        },
        {
            key: 'closed',
            title: t('ticketing.statuses.closed'),
            desc: t('ticketing.kpis.closedTicketsDesc'),
            count: statusCounts.CLOSED,
            percent: `${safePct(statusCounts.CLOSED)}%`,
            icon: Archive,
            accentClass: 'bg-[#857E74]/15 border-[#857E74]/30 text-[#595550]',
            badgeClass: 'bg-[#FAF8F5] text-[#595550] border border-[#E5E0D8]',
        },
    ];

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
                        <span>{currentMonthYearLabel}</span>
                    </span>
                    <span
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono font-bold text-[#0D0D0D] shadow-2xs"
                        dir="ltr"
                    >
                        {totalTickets} {t('ticketing.labels.tickets')}
                    </span>
                </div>
            </div>

            {/* 6 Dynamic KPI Cards: Total, New, Open, In Progress, Solved, Closed */}
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
                                <h3 className="text-xs font-semibold text-[#0D0D0D] mt-1">
                                    {card.title}
                                </h3>
                                <p className="text-[11px] text-[#6E6862] mt-0.5 line-clamp-1">
                                    {card.desc}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Row 1: Tickets by Status & Tickets by Priority */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Tickets by Status */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                    <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FolderOpen size={15} className="text-[#857E74]" />
                            <h2 className="text-xs font-semibold text-[#0D0D0D] tracking-wide uppercase">
                                {t('ticketing.dashboard.sections.byStatus')}
                            </h2>
                        </div>
                        <span
                            className="text-xs font-mono font-bold text-[#2D3F2C]"
                            dir="ltr"
                        >
                            {t('common.total', { count: totalTickets })}
                        </span>
                    </div>
                    <div className="p-6 space-y-4">
                        <div
                            ref={statusChartRef}
                            className="h-52 min-h-[208px] w-full min-w-0"
                            style={{ width: '100%', height: 208, minHeight: 208 }}
                            dir="ltr"
                        >
                            <ResponsiveContainer
                                width={statusChartWidth}
                                height={208}
                                initialDimension={{ width: statusChartWidth, height: 208 }}
                            >
                                <BarChart
                                    width={statusChartWidth}
                                    height={208}
                                    data={statusBreakdown}
                                    margin={{ top: 10, right: 20, left: -10, bottom: 10 }}
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
                                        formatter={(val: any) => [
                                            `${val} ${t('ticketing.labels.tickets')}`,
                                            t('ticketing.labels.ticketsCount'),
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
                                        barSize={28}
                                        isAnimationActive={false}
                                    >
                                        {statusBreakdown.map((entry, index) => (
                                            <Cell key={`st-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="pt-3 border-t border-[#EFECE6] space-y-2.5 text-start">
                            {statusBreakdown.map((item) => (
                                <div
                                    key={item.status}
                                    className="flex items-center justify-between text-xs"
                                >
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`w-2.5 h-2.5 rounded-full ${item.bgClass}`}
                                        />
                                        <span className="font-medium text-[#0D0D0D]">
                                            {item.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span
                                            className="text-[11px] font-mono text-[#6E6862]"
                                            dir="ltr"
                                        >
                                            {item.percent}%
                                        </span>
                                        <div className="w-24 bg-[#FAF8F5] rounded-full h-1.5 overflow-hidden border border-[#E5E0D8]">
                                            <div
                                                className={`${item.bgClass} h-full rounded-full`}
                                                style={{ width: `${item.percent}%` }}
                                            />
                                        </div>
                                        <span
                                            className="font-mono font-bold text-[#0D0D0D] w-6 text-end"
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

                {/* 2. Tickets by Priority */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                    <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={15} className="text-[#857E74]" />
                            <h2 className="text-xs font-semibold text-[#0D0D0D] tracking-wide uppercase">
                                {t('ticketing.dashboard.sections.byPriority')}
                            </h2>
                        </div>
                        <span
                            className="text-xs font-mono font-bold text-[#8C6046]"
                            dir="ltr"
                        >
                            {totalTickets} {t('ticketing.labels.totalTickets')}
                        </span>
                    </div>
                    <div className="p-6">
                        <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
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
                                            data={priorityData}
                                            innerRadius={60}
                                            outerRadius={88}
                                            paddingAngle={4}
                                            dataKey="value"
                                            isAnimationActive={false}
                                        >
                                            {priorityData.map((entry, index) => (
                                                <Cell
                                                    key={`prio-${index}`}
                                                    fill={entry.color}
                                                />
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
                                                `${value} (${safePct(Number(value))}%)`,
                                                name,
                                            ]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span
                                        className="text-xl font-bold font-mono text-[#0D0D0D]"
                                        dir="ltr"
                                    >
                                        {totalTickets}
                                    </span>
                                    <span className="text-[10px] uppercase font-semibold text-[#6E6862] tracking-wider">
                                        {t('ticketing.labels.tickets')}
                                    </span>
                                </div>
                            </div>

                            <div className="w-full sm:w-auto flex-1 space-y-3">
                                {priorityData.map((prio) => (
                                    <div
                                        key={prio.key}
                                        className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-start"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="w-2.5 h-2.5 rounded-full"
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
                                        <div className="flex items-center justify-between mt-1.5">
                                            <span className="text-[11px] text-[#6E6862]">
                                                {t('ticketing.labels.ticketsCount')}
                                            </span>
                                            <span
                                                className="text-base font-bold font-mono text-[#0D0D0D]"
                                                dir="ltr"
                                            >
                                                {prio.value}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 2: Tickets by Type & Tickets by Company */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 3. Tickets by Type */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                    <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Tag size={15} className="text-[#857E74]" />
                            <h2 className="text-xs font-semibold text-[#0D0D0D] tracking-wide uppercase">
                                {t('ticketing.dashboard.sections.byType')}
                            </h2>
                        </div>
                        <span
                            className="text-xs font-mono font-bold text-[#2D3F2C]"
                            dir="ltr"
                        >
                            {typeData.length}
                        </span>
                    </div>
                    <div className="p-6 space-y-3 text-start">
                        {typeData.length === 0 ? (
                            <p className="text-xs text-[#857E74] text-center py-8">
                                {t('common.noRecordsMatch')}
                            </p>
                        ) : (
                            typeData.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between text-xs gap-4"
                                >
                                    <span className="text-[#0D0D0D] font-medium truncate max-w-[220px]">
                                        {item.name}
                                    </span>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span
                                            className="text-[11px] font-mono text-[#6E6862] w-12 text-end"
                                            dir="ltr"
                                        >
                                            {item.percent}%
                                        </span>
                                        <div className="w-28 bg-[#FAF8F5] rounded-full h-2 overflow-hidden border border-[#E5E0D8]">
                                            <div
                                                className="bg-[#2D3F2C] h-full rounded-full"
                                                style={{ width: `${item.percent}%` }}
                                            />
                                        </div>
                                        <span
                                            className="font-mono font-bold text-[#0D0D0D] w-6 text-end"
                                            dir="ltr"
                                        >
                                            {item.count}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 4. Tickets by Company */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                    <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Building2 size={15} className="text-[#857E74]" />
                            <h2 className="text-xs font-semibold text-[#0D0D0D] tracking-wide uppercase">
                                {t('ticketing.sections.byCompany')}
                            </h2>
                        </div>
                        <span
                            className="text-xs font-mono font-bold text-[#6A7358]"
                            dir="ltr"
                        >
                            {companyData.length} {t('ticketing.labels.company')}
                        </span>
                    </div>
                    <div className="p-6 space-y-3 text-start">
                        {companyData.length === 0 ? (
                            <p className="text-xs text-[#857E74] text-center py-8">
                                {t('common.noRecordsMatch')}
                            </p>
                        ) : (
                            companyData.map((comp, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between text-xs gap-4"
                                >
                                    <span className="text-[#0D0D0D] font-medium truncate max-w-[220px]">
                                        {comp.name}
                                    </span>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span
                                            className="text-[11px] font-mono text-[#6E6862] w-12 text-end"
                                            dir="ltr"
                                        >
                                            {comp.percent}%
                                        </span>
                                        <div className="w-28 bg-[#FAF8F5] rounded-full h-2 overflow-hidden border border-[#E5E0D8]">
                                            <div
                                                className="bg-[#6A7358] h-full rounded-full"
                                                style={{ width: `${comp.percent}%` }}
                                            />
                                        </div>
                                        <span
                                            className="font-mono font-bold text-[#0D0D0D] w-6 text-end"
                                            dir="ltr"
                                        >
                                            {comp.count}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Row 3: Monthly Trend Based on Actual Ticket Timestamps */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Calendar size={15} className="text-[#857E74]" />
                        <h2 className="text-xs font-semibold text-[#0D0D0D] tracking-wide uppercase">
                            {t('ticketing.sections.monthlyStatus')}
                        </h2>
                    </div>
                    <span
                        className="text-xs font-mono font-bold text-[#2D3F2C]"
                        dir="ltr"
                    >
                        {currentMonthYearLabel}
                    </span>
                </div>
                <div className="p-6" dir="ltr">
                    <div
                        ref={monthlyChartRef}
                        className="h-64 min-h-[256px] w-full min-w-0"
                        style={{ width: '100%', height: 256, minHeight: 256 }}
                    >
                        <ResponsiveContainer
                            width={monthlyChartWidth}
                            height={256}
                            initialDimension={{ width: monthlyChartWidth, height: 256 }}
                        >
                            <BarChart
                                width={monthlyChartWidth}
                                height={256}
                                data={monthlyTrendData}
                                margin={{ top: 15, right: 20, left: -10, bottom: 10 }}
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
                                <Bar
                                    dataKey={t('ticketing.labels.totalTickets')}
                                    fill="#2D3F2C"
                                    radius={[4, 4, 0, 0]}
                                    barSize={26}
                                    isAnimationActive={false}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
