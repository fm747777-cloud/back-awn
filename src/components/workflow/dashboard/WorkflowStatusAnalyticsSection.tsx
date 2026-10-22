import React, { useEffect, useRef, useState } from 'react';
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
    ArrowRight,
    BarChart3,
    PieChart as PieChartIcon,
    type LucideIcon,
} from 'lucide-react';
import type { WorkflowSource } from '../../../pages/workflow/workflowMockData';

export interface WorkflowStatusChartPoint {
    key: string;
    name: string;
    count: number;
    percent: string;
    color: string;
}

export interface WorkflowSourceBreakdownItem {
    source: WorkflowSource;
    total: number;
    enabled: number;
    disabled: number;
}

interface WorkflowStatusAnalyticsSectionProps {
    sectionId: string;
    icon: LucideIcon;
    title: string;
    description: string;
    totalCount: number;
    actionLabel: string;
    onActionClick: () => void;
    pipelineLabel: string;
    chartData: WorkflowStatusChartPoint[];
    sourceBreakdownTitle: string;
    sourceSummary: WorkflowSourceBreakdownItem[];
    sourceGridColsClassName: string;
}

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

export const WorkflowStatusAnalyticsSection: React.FC<
    WorkflowStatusAnalyticsSectionProps
> = ({
    sectionId,
    icon: Icon,
    title,
    description,
    totalCount,
    actionLabel,
    onActionClick,
    pipelineLabel,
    chartData,
    sourceBreakdownTitle,
    sourceSummary,
    sourceGridColsClassName,
}) => {
    const { t } = useTranslation();
    const [barRef, barWidth] = useChartContainerWidth(520);
    const [pieRef, pieWidth] = useChartContainerWidth(320);

    return (
        <section
            aria-labelledby={sectionId}
            className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden"
        >
            <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#037F8C] text-[#FAF8F5] flex items-center justify-center shrink-0">
                        <Icon size={16} className="text-[#BFAB93]" />
                    </div>
                    <div>
                        <h2
                            id={sectionId}
                            className="text-sm font-bold text-[#0D0D0D] tracking-tight"
                        >
                            {title}
                        </h2>
                        <p className="text-[11px] text-[#6E6862]">{description}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                    <span
                        className="text-xs font-mono font-bold text-[#037F8C] bg-white border border-[#E5E0D8] px-2.5 py-1 rounded-md"
                        dir="ltr"
                    >
                        {totalCount} {t('workflow.dashboard.labels.workflows')}
                    </span>
                    <button
                        type="button"
                        onClick={onActionClick}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#037F8C] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                    >
                        <span>{actionLabel}</span>
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
                                <BarChart3 size={14} className="text-[#037F8C]" />
                                <span>
                                    {t('workflow.dashboard.labels.statusDistributionChart')}
                                </span>
                            </span>
                            <span className="text-[11px] text-[#6E6862]">{pipelineLabel}</span>
                        </div>
                        <div
                            ref={barRef}
                            className="h-60 min-h-[240px] w-full min-w-0"
                            style={{ width: '100%', height: 240, minHeight: 240 }}
                            dir="ltr"
                        >
                            <ResponsiveContainer
                                width={barWidth}
                                height={240}
                                initialDimension={{
                                    width: barWidth,
                                    height: 240,
                                }}
                            >
                                <BarChart
                                    width={barWidth}
                                    height={240}
                                    data={chartData}
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
                                            title,
                                        ]}
                                        contentStyle={{
                                            backgroundColor: '#0D0D0D',
                                            borderColor: '#037F8C',
                                            borderRadius: '8px',
                                            color: '#FAF8F5',
                                            fontSize: '12px',
                                        }}
                                    />
                                    <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={34}>
                                        {chartData.map((entry) => (
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
                                <PieChartIcon size={14} className="text-[#037F8C]" />
                                <span>{t('workflow.dashboard.labels.statusShare')}</span>
                            </span>
                            <span className="text-[11px] font-mono text-[#6E6862]" dir="ltr">
                                100%
                            </span>
                        </div>

                        <div
                            ref={pieRef}
                            className="h-48 min-h-[192px] w-full min-w-0"
                            style={{ width: '100%', height: 192, minHeight: 192 }}
                            dir="ltr"
                        >
                            <ResponsiveContainer
                                width={pieWidth}
                                height={192}
                                initialDimension={{
                                    width: pieWidth,
                                    height: 192,
                                }}
                            >
                                <PieChart width={pieWidth} height={192}>
                                    <Pie
                                        data={chartData}
                                        dataKey="count"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={48}
                                        outerRadius={74}
                                        paddingAngle={3}
                                    >
                                        {chartData.map((entry) => (
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
                                            borderColor: '#037F8C',
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
                            {chartData.map((item) => (
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

                {/* Source Module Breakdown Strip */}
                <div className="pt-2 border-t border-[#F0ECE4]">
                    <p className="text-[11px] font-semibold text-[#6E6862] uppercase tracking-wider mb-3">
                        {sourceBreakdownTitle}
                    </p>
                    <div className={sourceGridColsClassName}>
                        {sourceSummary.map((src) => (
                            <div
                                key={src.source}
                                className="px-4 py-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between"
                            >
                                <div>
                                    <span
                                        className="text-xs font-mono font-bold text-[#037F8C] block"
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
    );
};
