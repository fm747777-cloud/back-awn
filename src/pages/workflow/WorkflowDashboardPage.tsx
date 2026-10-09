import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    GitBranch,
    CheckCircle2,
    ShieldCheck,
    Mail,
    PauseCircle,
    Layers,
    Calendar,
    ArrowRight,
    PieChart as PieChartIcon,
    BarChart3,
} from 'lucide-react';
import {
    loadWorkflowRecords,
    APPROVAL_WORKFLOWS_BY_STATUS_DATA,
    COMMUNICATION_WORKFLOWS_BY_STATUS_DATA,
    WORKFLOW_SOURCES,
    type WorkflowRecord,
    type WorkflowSource,
} from './workflowMockData';

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

export const WorkflowDashboardPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isAr = i18n.language?.startsWith('ar');

    const [approvalBarRef, approvalBarWidth] = useChartContainerWidth(520);
    const [approvalPieRef, approvalPieWidth] = useChartContainerWidth(320);
    const [commBarRef, commBarWidth] = useChartContainerWidth(520);
    const [commPieRef, commPieWidth] = useChartContainerWidth(320);

    const [records, setRecords] = useState<WorkflowRecord[]>(() => loadWorkflowRecords());

    useEffect(() => {
        const refresh = () => {
            setRecords(loadWorkflowRecords());
        };
        refresh();
        window.addEventListener('focus', refresh);
        window.addEventListener('storage', refresh);
        return () => {
            window.removeEventListener('focus', refresh);
            window.removeEventListener('storage', refresh);
        };
    }, []);

    const currentMonthYearLabel = useMemo(() => {
        try {
            return new Intl.DateTimeFormat(isAr ? 'ar-SA-u-ca-gregory' : 'en-US', {
                month: 'long',
                year: 'numeric',
            }).format(new Date());
        } catch {
            return 'April 2026';
        }
    }, [isAr]);

    // Derived counts from persisted workflow records
    const approvalRecords = useMemo(
        () => records.filter((r) => r.workflowType === 'approval'),
        [records]
    );
    const communicationRecords = useMemo(
        () => records.filter((r) => r.workflowType === 'communication'),
        [records]
    );

    const totalWorkflows = records.length;
    const enabledWorkflows = useMemo(
        () => records.filter((r) => r.status === 'Enabled').length,
        [records]
    );
    const disabledWorkflows = useMemo(
        () => records.filter((r) => r.status === 'Disabled').length,
        [records]
    );
    const connectedSourcesCount = useMemo(() => {
        const set = new Set(records.map((r) => r.source));
        return set.size;
    }, [records]);

    const safePct = (count: number, total: number): string => {
        if (!Number.isFinite(count) || !Number.isFinite(total) || total <= 0) {
            return '0.0';
        }
        return ((count / total) * 100).toFixed(1);
    };

    // Approval Workflows By Status chart dataset (synced with live Enabled/Disabled counts)
    const approvalStatusChartData = useMemo(() => {
        const enabledCount = approvalRecords.filter((r) => r.status === 'Enabled').length;
        const disabledCount = approvalRecords.filter((r) => r.status === 'Disabled').length;

        const rawItems = APPROVAL_WORKFLOWS_BY_STATUS_DATA.map((item) => {
            if (item.statusKey === 'enabled') {
                return { ...item, count: enabledCount };
            }
            if (item.statusKey === 'disabled') {
                return { ...item, count: Math.max(disabledCount, item.count) };
            }
            return item;
        });

        const total = rawItems.reduce((sum, item) => sum + item.count, 0);

        return rawItems.map((item) => ({
            key: item.statusKey,
            name: isAr ? item.labelAr : item.labelEn,
            count: item.count,
            percent: safePct(item.count, total),
            color: item.color,
        }));
    }, [approvalRecords, isAr]);

    // Communication Workflows By Status chart dataset (synced with live Enabled/Disabled counts)
    const communicationStatusChartData = useMemo(() => {
        const enabledCount = communicationRecords.filter((r) => r.status === 'Enabled').length;
        const disabledCount = communicationRecords.filter((r) => r.status === 'Disabled').length;

        const rawItems = COMMUNICATION_WORKFLOWS_BY_STATUS_DATA.map((item) => {
            if (item.statusKey === 'enabled') {
                return { ...item, count: enabledCount };
            }
            if (item.statusKey === 'disabled') {
                return { ...item, count: Math.max(disabledCount, item.count) };
            }
            return item;
        });

        const total = rawItems.reduce((sum, item) => sum + item.count, 0);

        return rawItems.map((item) => ({
            key: item.statusKey,
            name: isAr ? item.labelAr : item.labelEn,
            count: item.count,
            percent: safePct(item.count, total),
            color: item.color,
        }));
    }, [communicationRecords, isAr]);

    // Source breakdown per workflow type
    const approvalSourceSummary = useMemo(() => {
        const map = new Map<WorkflowSource, { total: number; enabled: number }>();
        for (const src of WORKFLOW_SOURCES) {
            map.set(src, { total: 0, enabled: 0 });
        }
        for (const rec of approvalRecords) {
            const entry = map.get(rec.source) || { total: 0, enabled: 0 };
            entry.total += 1;
            if (rec.status === 'Enabled') entry.enabled += 1;
            map.set(rec.source, entry);
        }
        return Array.from(map.entries())
            .filter(([, val]) => val.total > 0)
            .map(([source, val]) => ({
                source,
                total: val.total,
                enabled: val.enabled,
                disabled: val.total - val.enabled,
            }));
    }, [approvalRecords]);

    const communicationSourceSummary = useMemo(() => {
        const map = new Map<WorkflowSource, { total: number; enabled: number }>();
        for (const src of WORKFLOW_SOURCES) {
            map.set(src, { total: 0, enabled: 0 });
        }
        for (const rec of communicationRecords) {
            const entry = map.get(rec.source) || { total: 0, enabled: 0 };
            entry.total += 1;
            if (rec.status === 'Enabled') entry.enabled += 1;
            map.set(rec.source, entry);
        }
        return Array.from(map.entries())
            .filter(([, val]) => val.total > 0)
            .map(([source, val]) => ({
                source,
                total: val.total,
                enabled: val.enabled,
                disabled: val.total - val.enabled,
            }));
    }, [communicationRecords]);

    const kpiCards = useMemo(
        () => [
            {
                key: 'totalWorkflows',
                title: t('workflow.dashboard.kpis.totalWorkflows'),
                desc: t('workflow.dashboard.kpis.totalWorkflowsDesc'),
                count: totalWorkflows,
                percent: '100%',
                icon: GitBranch,
                accentClass: 'bg-[#2D3F2C]/10 border-[#2D3F2C]/20 text-[#2D3F2C]',
                badgeClass: 'bg-[#2D3F2C]/10 text-[#2D3F2C]',
            },
            {
                key: 'approvalWorkflows',
                title: t('workflow.dashboard.kpis.approvalWorkflows'),
                desc: t('workflow.dashboard.kpis.approvalWorkflowsDesc'),
                count: approvalRecords.length,
                percent: `${safePct(approvalRecords.length, totalWorkflows)}%`,
                icon: ShieldCheck,
                accentClass: 'bg-[#265938]/10 border-[#265938]/20 text-[#265938]',
                badgeClass: 'bg-[#265938]/10 text-[#265938]',
            },
            {
                key: 'communicationWorkflows',
                title: t('workflow.dashboard.kpis.communicationWorkflows'),
                desc: t('workflow.dashboard.kpis.communicationWorkflowsDesc'),
                count: communicationRecords.length,
                percent: `${safePct(communicationRecords.length, totalWorkflows)}%`,
                icon: Mail,
                accentClass: 'bg-[#6A7358]/15 border-[#6A7358]/25 text-[#2D3F2C]',
                badgeClass: 'bg-[#6A7358]/15 text-[#2D3F2C]',
            },
            {
                key: 'enabledWorkflows',
                title: t('workflow.dashboard.kpis.enabledWorkflows'),
                desc: t('workflow.dashboard.kpis.enabledWorkflowsDesc'),
                count: enabledWorkflows,
                percent: `${safePct(enabledWorkflows, totalWorkflows)}%`,
                icon: CheckCircle2,
                accentClass: 'bg-[#2D3F2C]/10 border-[#2D3F2C]/20 text-[#2D3F2C]',
                badgeClass: 'bg-[#265938]/10 text-[#265938]',
            },
            {
                key: 'disabledWorkflows',
                title: t('workflow.dashboard.kpis.disabledWorkflows'),
                desc: t('workflow.dashboard.kpis.disabledWorkflowsDesc'),
                count: disabledWorkflows,
                percent: `${safePct(disabledWorkflows, totalWorkflows)}%`,
                icon: PauseCircle,
                accentClass: 'bg-[#8C6046]/10 border-[#8C6046]/20 text-[#8C6046]',
                badgeClass: 'bg-[#8C6046]/10 text-[#8C6046]',
            },
            {
                key: 'connectedSources',
                title: t('workflow.dashboard.kpis.connectedSources'),
                desc: t('workflow.dashboard.kpis.connectedSourcesDesc'),
                count: connectedSourcesCount,
                percent: t('workflow.dashboard.labels.modulesTag'),
                icon: Layers,
                accentClass: 'bg-[#BFAB93]/25 border-[#BFAB93]/40 text-[#595550]',
                badgeClass: 'bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8]',
            },
        ],
        [
            t,
            totalWorkflows,
            approvalRecords.length,
            communicationRecords.length,
            enabledWorkflows,
            disabledWorkflows,
            connectedSourcesCount,
        ]
    );

    return (
        <div className="space-y-6 text-start">
            {/* Unified Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                        {t('workflow.dashboard.title')}
                    </h1>
                    <p className="text-xs text-[#6E6862] mt-1 font-normal">
                        {t('workflow.dashboard.description')}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-xs font-medium text-[#2D3F2C] shadow-2xs">
                        <Calendar size={13} className="text-[#857E74]" />
                        <span>{currentMonthYearLabel}</span>
                    </span>
                    <button
                        type="button"
                        onClick={() => navigate('/workflow/workflows')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2D3F2C] hover:bg-[#233122] text-xs font-medium text-[#FAF8F5] transition-colors cursor-pointer shadow-2xs"
                    >
                        <GitBranch size={13} />
                        <span>{t('workflow.dashboard.actions.manageWorkflows')}</span>
                        <ArrowRight size={13} className="rtl:rotate-180" />
                    </button>
                </div>
            </div>

            {/* 6 KPI Summary Cards */}
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

            {/* Section 1: Approval Workflows By Status */}
            <section
                aria-labelledby="wfl-section-approval-status"
                className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden"
            >
                <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#2D3F2C] text-[#FAF8F5] flex items-center justify-center shrink-0">
                            <ShieldCheck size={16} className="text-[#BFAB93]" />
                        </div>
                        <div>
                            <h2
                                id="wfl-section-approval-status"
                                className="text-sm font-bold text-[#0D0D0D] tracking-tight"
                            >
                                {t('workflow.dashboard.sections.approvalWorkflowsByStatus')}
                            </h2>
                            <p className="text-[11px] text-[#6E6862]">
                                {t('workflow.dashboard.sections.approvalWorkflowsByStatusDesc')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-auto">
                        <span
                            className="text-xs font-mono font-bold text-[#2D3F2C] bg-white border border-[#E5E0D8] px-2.5 py-1 rounded-md"
                            dir="ltr"
                        >
                            {approvalRecords.length} {t('workflow.dashboard.labels.workflows')}
                        </span>
                        <button
                            type="button"
                            onClick={() => navigate('/workflow/workflows?tab=approval')}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#2D3F2C] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                        >
                            <span>{t('workflow.dashboard.actions.viewApprovalWorkflows')}</span>
                            <ArrowRight size={13} className="rtl:rotate-180" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                        {/* Bar Chart */}
                        <div className="lg:col-span-7 bg-[#FAF8F5]/60 border border-[#E5E0D8] rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D0D0D]">
                                    <BarChart3 size={14} className="text-[#2D3F2C]" />
                                    <span>{t('workflow.dashboard.labels.statusDistributionChart')}</span>
                                </span>
                                <span className="text-[11px] text-[#6E6862]">
                                    {t('workflow.dashboard.labels.approvalPipeline')}
                                </span>
                            </div>
                            <div
                                ref={approvalBarRef}
                                className="h-60 min-h-[240px] w-full min-w-0"
                                style={{ width: '100%', height: 240, minHeight: 240 }}
                                dir="ltr"
                            >
                                <ResponsiveContainer
                                    width={approvalBarWidth}
                                    height={240}
                                    initialDimension={{
                                        width: approvalBarWidth,
                                        height: 240,
                                    }}
                                >
                                    <BarChart
                                        width={approvalBarWidth}
                                        height={240}
                                        data={approvalStatusChartData}
                                        margin={{ top: 10, right: 16, left: -12, bottom: 24 }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            stroke="#EFECE6"
                                        />
                                        <XAxis
                                            dataKey="name"
                                            interval={0}
                                            tick={{ fill: '#595550', fontSize: 11 }}
                                            height={36}
                                        />
                                        <YAxis
                                            allowDecimals={false}
                                            tick={{ fill: '#6E6862', fontSize: 11 }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#F3EFE8' }}
                                            formatter={(value: number | string | undefined) => [
                                                `${value ?? 0} ${t('workflow.dashboard.labels.workflows')}`,
                                                t('workflow.dashboard.sections.approvalWorkflowsByStatus'),
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
                                            radius={[6, 6, 0, 0]}
                                            barSize={34}
                                        >
                                            {approvalStatusChartData.map((entry) => (
                                                <Cell key={entry.key} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Donut Chart + Status Breakdown */}
                        <div className="lg:col-span-5 bg-[#FAF8F5]/60 border border-[#E5E0D8] rounded-xl p-4 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-2">
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D0D0D]">
                                    <PieChartIcon size={14} className="text-[#2D3F2C]" />
                                    <span>{t('workflow.dashboard.labels.statusShare')}</span>
                                </span>
                                <span className="text-[11px] font-mono text-[#6E6862]" dir="ltr">
                                    100%
                                </span>
                            </div>

                            <div
                                ref={approvalPieRef}
                                className="h-48 min-h-[192px] w-full min-w-0"
                                style={{ width: '100%', height: 192, minHeight: 192 }}
                                dir="ltr"
                            >
                                <ResponsiveContainer
                                    width={approvalPieWidth}
                                    height={192}
                                    initialDimension={{
                                        width: approvalPieWidth,
                                        height: 192,
                                    }}
                                >
                                    <PieChart width={approvalPieWidth} height={192}>
                                        <Pie
                                            data={approvalStatusChartData}
                                            dataKey="count"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={48}
                                            outerRadius={74}
                                            paddingAngle={3}
                                        >
                                            {approvalStatusChartData.map((entry) => (
                                                <Cell key={entry.key} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number | string | undefined) => [
                                                `${value ?? 0} ${t('workflow.dashboard.labels.workflows')}`,
                                                t('workflow.dashboard.labels.status'),
                                            ]}
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
                            </div>

                            {/* Status Legend Rows */}
                            <div className="space-y-2 mt-2 pt-3 border-t border-[#E5E0D8]">
                                {approvalStatusChartData.map((item) => (
                                    <div
                                        key={item.key}
                                        className="flex items-center justify-between text-xs"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span
                                                className="w-2.5 h-2.5 rounded-xs shrink-0"
                                                style={{ backgroundColor: item.color }}
                                            />
                                            <span className="text-[#0D0D0D] font-medium truncate">
                                                {item.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0" dir="ltr">
                                            <span className="font-mono font-bold text-[#0D0D0D]">
                                                {item.count}
                                            </span>
                                            <span className="text-[11px] font-mono text-[#6E6862] w-12 text-end">
                                                ({item.percent}%)
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Source Module Breakdown Strip for Approval Workflows */}
                    <div className="pt-2 border-t border-[#F0ECE4]">
                        <p className="text-[11px] font-semibold text-[#6E6862] uppercase tracking-wider mb-3">
                            {t('workflow.dashboard.labels.approvalBySourceModule')}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            {approvalSourceSummary.map((src) => (
                                <div
                                    key={src.source}
                                    className="px-4 py-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between"
                                >
                                    <div>
                                        <span
                                            className="text-xs font-mono font-bold text-[#2D3F2C] block"
                                            dir="ltr"
                                        >
                                            {src.source}
                                        </span>
                                        <span className="text-[11px] text-[#6E6862]">
                                            {t('workflow.dashboard.labels.enabledCount', {
                                                count: src.enabled,
                                            })}
                                        </span>
                                    </div>
                                    <span
                                        className="text-lg font-mono font-bold text-[#0D0D0D]"
                                        dir="ltr"
                                    >
                                        {src.total}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 2: Communication Workflows By Status */}
            <section
                aria-labelledby="wfl-section-communication-status"
                className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden"
            >
                <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#2D3F2C] text-[#FAF8F5] flex items-center justify-center shrink-0">
                            <Mail size={16} className="text-[#BFAB93]" />
                        </div>
                        <div>
                            <h2
                                id="wfl-section-communication-status"
                                className="text-sm font-bold text-[#0D0D0D] tracking-tight"
                            >
                                {t('workflow.dashboard.sections.communicationWorkflowsByStatus')}
                            </h2>
                            <p className="text-[11px] text-[#6E6862]">
                                {t('workflow.dashboard.sections.communicationWorkflowsByStatusDesc')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-auto">
                        <span
                            className="text-xs font-mono font-bold text-[#2D3F2C] bg-white border border-[#E5E0D8] px-2.5 py-1 rounded-md"
                            dir="ltr"
                        >
                            {communicationRecords.length} {t('workflow.dashboard.labels.workflows')}
                        </span>
                        <button
                            type="button"
                            onClick={() => navigate('/workflow/workflows?tab=communication')}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#2D3F2C] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                        >
                            <span>{t('workflow.dashboard.actions.viewCommunicationWorkflows')}</span>
                            <ArrowRight size={13} className="rtl:rotate-180" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                        {/* Bar Chart */}
                        <div className="lg:col-span-7 bg-[#FAF8F5]/60 border border-[#E5E0D8] rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D0D0D]">
                                    <BarChart3 size={14} className="text-[#2D3F2C]" />
                                    <span>{t('workflow.dashboard.labels.statusDistributionChart')}</span>
                                </span>
                                <span className="text-[11px] text-[#6E6862]">
                                    {t('workflow.dashboard.labels.communicationPipeline')}
                                </span>
                            </div>
                            <div
                                ref={commBarRef}
                                className="h-60 min-h-[240px] w-full min-w-0"
                                style={{ width: '100%', height: 240, minHeight: 240 }}
                                dir="ltr"
                            >
                                <ResponsiveContainer
                                    width={commBarWidth}
                                    height={240}
                                    initialDimension={{
                                        width: commBarWidth,
                                        height: 240,
                                    }}
                                >
                                    <BarChart
                                        width={commBarWidth}
                                        height={240}
                                        data={communicationStatusChartData}
                                        margin={{ top: 10, right: 16, left: -12, bottom: 24 }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            stroke="#EFECE6"
                                        />
                                        <XAxis
                                            dataKey="name"
                                            interval={0}
                                            tick={{ fill: '#595550', fontSize: 11 }}
                                            height={36}
                                        />
                                        <YAxis
                                            allowDecimals={false}
                                            tick={{ fill: '#6E6862', fontSize: 11 }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#F3EFE8' }}
                                            formatter={(value: number | string | undefined) => [
                                                `${value ?? 0} ${t('workflow.dashboard.labels.workflows')}`,
                                                t('workflow.dashboard.sections.communicationWorkflowsByStatus'),
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
                                            radius={[6, 6, 0, 0]}
                                            barSize={34}
                                        >
                                            {communicationStatusChartData.map((entry) => (
                                                <Cell key={entry.key} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Donut Chart + Status Breakdown */}
                        <div className="lg:col-span-5 bg-[#FAF8F5]/60 border border-[#E5E0D8] rounded-xl p-4 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-2">
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D0D0D]">
                                    <PieChartIcon size={14} className="text-[#2D3F2C]" />
                                    <span>{t('workflow.dashboard.labels.statusShare')}</span>
                                </span>
                                <span className="text-[11px] font-mono text-[#6E6862]" dir="ltr">
                                    100%
                                </span>
                            </div>

                            <div
                                ref={commPieRef}
                                className="h-48 min-h-[192px] w-full min-w-0"
                                style={{ width: '100%', height: 192, minHeight: 192 }}
                                dir="ltr"
                            >
                                <ResponsiveContainer
                                    width={commPieWidth}
                                    height={192}
                                    initialDimension={{
                                        width: commPieWidth,
                                        height: 192,
                                    }}
                                >
                                    <PieChart width={commPieWidth} height={192}>
                                        <Pie
                                            data={communicationStatusChartData}
                                            dataKey="count"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={48}
                                            outerRadius={74}
                                            paddingAngle={3}
                                        >
                                            {communicationStatusChartData.map((entry) => (
                                                <Cell key={entry.key} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number | string | undefined) => [
                                                `${value ?? 0} ${t('workflow.dashboard.labels.workflows')}`,
                                                t('workflow.dashboard.labels.status'),
                                            ]}
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
                            </div>

                            {/* Status Legend Rows */}
                            <div className="space-y-2 mt-2 pt-3 border-t border-[#E5E0D8]">
                                {communicationStatusChartData.map((item) => (
                                    <div
                                        key={item.key}
                                        className="flex items-center justify-between text-xs"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span
                                                className="w-2.5 h-2.5 rounded-xs shrink-0"
                                                style={{ backgroundColor: item.color }}
                                            />
                                            <span className="text-[#0D0D0D] font-medium truncate">
                                                {item.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0" dir="ltr">
                                            <span className="font-mono font-bold text-[#0D0D0D]">
                                                {item.count}
                                            </span>
                                            <span className="text-[11px] font-mono text-[#6E6862] w-12 text-end">
                                                ({item.percent}%)
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Source Module Breakdown Strip for Communication Workflows */}
                    <div className="pt-2 border-t border-[#F0ECE4]">
                        <p className="text-[11px] font-semibold text-[#6E6862] uppercase tracking-wider mb-3">
                            {t('workflow.dashboard.labels.communicationBySourceModule')}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            {communicationSourceSummary.map((src) => (
                                <div
                                    key={src.source}
                                    className="px-4 py-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between"
                                >
                                    <div>
                                        <span
                                            className="text-xs font-mono font-bold text-[#2D3F2C] block"
                                            dir="ltr"
                                        >
                                            {src.source}
                                        </span>
                                        <span className="text-[11px] text-[#6E6862]">
                                            {t('workflow.dashboard.labels.enabledCount', {
                                                count: src.enabled,
                                            })}
                                        </span>
                                    </div>
                                    <span
                                        className="text-lg font-mono font-bold text-[#0D0D0D]"
                                        dir="ltr"
                                    >
                                        {src.total}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
