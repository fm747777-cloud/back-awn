import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    BarChart,
    Bar,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import {
    Briefcase,
    TrendingUp,
    Award,
    XCircle,
    DollarSign,
    RefreshCw,
    RotateCcw,
    Calendar,
    CheckCircle2,
    AlertTriangle,
    ArrowUpRight,
    ClipboardList,
    Users,
    Clock,
} from 'lucide-react';
import { crmApi, CRM_SALES_EMPLOYEES } from '../../api/api';
import {
    useCrmSalesPerformanceDashboardQuery,
    useCrmOperationalTasks,
} from '../../components/crm/shared/useCrmWorkflowQueries';
import type { CrmDealStage } from '../../schemas/crmSchema';

export const DashboardSalesPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    // Focused filters for Sales Dashboard
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [employeeFilter, setEmployeeFilter] = useState<string>('all');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const queryFilters = useMemo(
        () => ({
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
            assignedEmployeeId: employeeFilter,
            sectorId: 'all',
            companyId: 'all',
        }),
        [dateFrom, dateTo, employeeFilter]
    );

    const {
        data: dashboard,
        isLoading: isDashboardLoading,
        isFetching: isDashboardFetching,
        isError: isDashboardError,
        error: dashboardError,
        refetch: refetchDashboard,
    } = useCrmSalesPerformanceDashboardQuery(queryFilters);

    const {
        data: tasksRes,
        isLoading: isTasksLoading,
        isFetching: isTasksFetching,
        refetch: refetchTasks,
    } = useCrmOperationalTasks({ limit: 200 });

    const {
        data: dealsRes,
        isLoading: isDealsLoading,
        isFetching: isDealsFetching,
        refetch: refetchDeals,
    } = useQuery({
        queryKey: ['crm', 'deals', 'dashboardSales'],
        queryFn: () => crmApi.deals.getAll({ limit: 200 }),
    });

    const { data: employees = CRM_SALES_EMPLOYEES } = useQuery({
        queryKey: ['crm', 'employees'],
        queryFn: () => crmApi.getSalesEmployees(),
    });

    const isLoading = isDashboardLoading || isTasksLoading || isDealsLoading;
    const isFetching =
        isDashboardFetching || isTasksFetching || isDealsFetching;

    const hasActiveFilters =
        Boolean(dateFrom) || Boolean(dateTo) || employeeFilter !== 'all';

    const showToast = (msg: string) => {
        setToastMessage(msg);
        window.setTimeout(() => setToastMessage(null), 3500);
    };

    const handleRefresh = async () => {
        await Promise.all([
            refetchDashboard(),
            refetchTasks(),
            refetchDeals(),
        ]);
        showToast(t('crm.dashboardSales.refreshedToast'));
    };

    const handleResetFilters = () => {
        setDateFrom('');
        setDateTo('');
        setEmployeeFilter('all');
    };

    const translateStage = useCallback(
        (stage: CrmDealStage) =>
            t(`crm.commercial.deals.stages.${stage}`, { defaultValue: stage }),
        [t]
    );

    // Filter helper for operational tasks and deals
    const isWithinDateWindow = useCallback(
        (rawDate?: string): boolean => {
            if (!dateFrom && !dateTo) return true;
            if (!rawDate) return false;
            const dateOnly = rawDate.trim().slice(0, 10);
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return false;
            if (dateFrom && dateOnly < dateFrom) return false;
            if (dateTo && dateOnly > dateTo) return false;
            return true;
        },
        [dateFrom, dateTo]
    );

    const filteredTasks = useMemo(() => {
        const list = (tasksRes?.data || []).filter(
            (task) => task.status !== 'inactive'
        );
        return list
            .filter((task) => {
                const matchesEmp =
                    employeeFilter === 'all' ||
                    task.assignedSpecialistId === employeeFilter;
                const matchesDate = isWithinDateWindow(
                    task.dueDate || task.createdAt
                );
                return matchesEmp && matchesDate;
            })
            .sort((a, b) => {
                const aOpen =
                    a.taskStatus !== 'Completed' &&
                    a.taskStatus !== 'Rejected'
                        ? 0
                        : 1;
                const bOpen =
                    b.taskStatus !== 'Completed' &&
                    b.taskStatus !== 'Rejected'
                        ? 0
                        : 1;
                if (aOpen !== bOpen) return aOpen - bOpen;
                return (a.dueDate || '').localeCompare(b.dueDate || '');
            });
    }, [tasksRes?.data, employeeFilter, isWithinDateWindow]);

    const openTasksCount = useMemo(
        () =>
            filteredTasks.filter(
                (tItem) =>
                    tItem.taskStatus !== 'Completed' &&
                    tItem.taskStatus !== 'Rejected'
            ).length,
        [filteredTasks]
    );

    const recentAndUpcomingDeals = useMemo(() => {
        const list = (dealsRes?.data || []).filter(
            (deal) => deal.status !== 'inactive'
        );
        return list
            .filter((deal) => {
                const matchesEmp =
                    employeeFilter === 'all' ||
                    deal.assignedEmployeeId === employeeFilter;
                const matchesDate = isWithinDateWindow(
                    deal.wonAt || deal.createdAt
                );
                return matchesEmp && matchesDate;
            })
            .sort((a, b) => {
                const aOpen = a.stage !== 'won' && a.stage !== 'lost' ? 0 : 1;
                const bOpen = b.stage !== 'won' && b.stage !== 'lost' ? 0 : 1;
                if (aOpen !== bOpen) return aOpen - bOpen;
                const aDate = a.expectedCloseDate || a.createdAt || '';
                const bDate = b.expectedCloseDate || b.createdAt || '';
                return aDate.localeCompare(bDate);
            })
            .slice(0, 6);
    }, [dealsRes?.data, employeeFilter, isWithinDateWindow]);

    const stageChartData = useMemo(() => {
        if (!dashboard) return [];
        return dashboard.stageBreakdown.map((item) => ({
            name: translateStage(item.stage),
            stage: item.stage,
            dealsCount: item.dealsCount,
            totalValue: item.totalValue,
            weightedValue: item.weightedValue,
            averageProbability: item.averageProbability,
            shareOfPipeline: item.shareOfPipeline,
        }));
    }, [dashboard, translateStage]);

    const isEmptyDataset =
        dashboard &&
        dashboard.kpis.totalDeals === 0 &&
        filteredTasks.length === 0;

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6 text-start">
            {toastMessage && (
                <div className="fixed bottom-5 end-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border bg-[#E9F5EE] border-[#2E6B4E]/30 text-[#2E6B4E] text-xs font-semibold">
                    <CheckCircle2 size={16} />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Concise Dashboard Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white rounded-2xl border border-[#E5E0D8] p-6 shadow-xs">
                <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E6862]">
                        <span
                            className="font-mono font-bold text-[#037F8C]"
                            dir="ltr"
                        >
                            {t('crm.dashboardSales.badge')}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold">
                            {t('crm.groups.main')}
                        </span>
                        {dashboard?.generatedAt && (
                            <>
                                <span aria-hidden="true">·</span>
                                <span
                                    className="text-[11px] font-mono text-[#857E74] tabular-nums"
                                    dir="ltr"
                                >
                                    {t('crm.dashboardSales.lastUpdated')}:{' '}
                                    {new Date(
                                        dashboard.generatedAt
                                    ).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </>
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-[#0D0D0D]">
                        {t('crm.pages.dashboardSales.title')}
                    </h1>
                    <p className="text-xs text-[#6E6862]">
                        {t('crm.pages.dashboardSales.subtitle')}
                    </p>
                </div>

                {/* Quick Navigation & Refresh Action */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate('/crm/deals')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-white text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                        <Briefcase size={13} className="text-[#037F8C]" />
                        {t('crm.dashboardSales.nav.deals')}
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/crm/leads')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-white text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                        <Users size={13} className="text-[#037F8C]" />
                        {t('crm.dashboardSales.nav.leads')}
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/crm/won-deals')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-white text-xs font-semibold text-[#2E6B4E] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                        <Award size={13} />
                        {t('crm.dashboardSales.nav.wonDeals')}
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/crm/operational-task')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-white text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                        <ClipboardList size={13} className="text-[#037F8C]" />
                        {t('crm.dashboardSales.nav.operationalTasks')}
                    </button>

                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={isFetching}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#037F8C] hover:bg-[#233222] disabled:opacity-60 text-xs font-semibold text-[#FAF8F5] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                        <RefreshCw
                            size={14}
                            className={isFetching ? 'animate-spin' : ''}
                        />
                        {isFetching
                            ? t('crm.dashboardSales.refreshing')
                            : t('crm.dashboardSales.refresh')}
                    </button>
                </div>
            </div>

            {/* Compact Filter Bar */}
            <div className="rounded-2xl bg-white border border-[#E5E0D8] p-4 space-y-3 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Calendar size={15} className="text-[#037F8C]" />
                        <span className="text-xs font-bold text-[#0D0D0D]">
                            {t('crm.dashboardSales.filters.title')}
                        </span>
                        {hasActiveFilters && (
                            <span className="text-[11px] font-semibold text-[#2E6B4E]">
                                · {t('crm.dashboardSales.filters.active')}
                            </span>
                        )}
                    </div>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer self-start sm:self-auto whitespace-nowrap shrink-0"
                        >
                            <RotateCcw size={13} />
                            {t('crm.dashboardSales.filters.reset')}
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                            {t('crm.dashboardSales.filters.repLabel')}
                        </label>
                        <select
                            value={employeeFilter}
                            onChange={(e) => setEmployeeFilter(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                        >
                            <option value="all">
                                {t('crm.dashboardSales.filters.allReps')}
                            </option>
                            {employees.map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                    {isRtl ? emp.nameAr : emp.nameEn}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                            {t('crm.dashboardSales.filters.dateFrom')}
                        </label>
                        <input
                            type="date"
                            value={dateFrom}
                            max={dateTo || undefined}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] font-mono tabular-nums focus:outline-none focus:bg-white focus:border-[#037F8C]"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                            {t('crm.dashboardSales.filters.dateTo')}
                        </label>
                        <input
                            type="date"
                            value={dateTo}
                            min={dateFrom || undefined}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] font-mono tabular-nums focus:outline-none focus:bg-white focus:border-[#037F8C]"
                        />
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-12 text-center space-y-3 shadow-xs">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center mx-auto text-[#037F8C]">
                        <RefreshCw size={18} className="animate-spin" />
                    </div>
                    <h2 className="text-sm font-bold text-[#0D0D0D]">
                        {t('crm.dashboardSales.states.loadingTitle')}
                    </h2>
                    <p className="text-xs text-[#6E6862] max-w-md mx-auto">
                        {t('crm.dashboardSales.states.loadingSubtitle')}
                    </p>
                </div>
            )}

            {/* Error State */}
            {!isLoading && isDashboardError && (
                <div className="rounded-2xl bg-white border border-[#A63A3A]/30 p-10 text-center space-y-3 shadow-xs">
                    <div className="w-11 h-11 rounded-xl bg-[#FDF2F2] text-[#A63A3A] flex items-center justify-center mx-auto">
                        <AlertTriangle size={20} />
                    </div>
                    <h2 className="text-sm font-bold text-[#0D0D0D]">
                        {t('crm.dashboardSales.states.errorTitle')}
                    </h2>
                    <p className="text-xs text-[#6E6862] max-w-md mx-auto">
                        {dashboardError instanceof Error
                            ? dashboardError.message
                            : t('crm.dashboardSales.states.errorSubtitle')}
                    </p>
                    <button
                        type="button"
                        onClick={handleRefresh}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#037F8C] text-[#FAF8F5] text-xs font-semibold cursor-pointer"
                    >
                        <RefreshCw size={13} />
                        {t('crm.dashboardSales.states.retry')}
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !isDashboardError && isEmptyDataset && (
                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-12 text-center space-y-3 shadow-xs">
                    <div className="w-11 h-11 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-[#6E6862] flex items-center justify-center mx-auto">
                        <Briefcase size={20} />
                    </div>
                    <h2 className="text-sm font-bold text-[#0D0D0D]">
                        {t('crm.dashboardSales.states.emptyTitle')}
                    </h2>
                    <p className="text-xs text-[#6E6862] max-w-md mx-auto">
                        {t('crm.dashboardSales.states.emptySubtitle')}
                    </p>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-white text-xs font-semibold text-[#0D0D0D] cursor-pointer"
                        >
                            <RotateCcw size={13} />
                            {t('crm.dashboardSales.filters.reset')}
                        </button>
                    )}
                </div>
            )}

            {/* Main Dashboard Content */}
            {!isLoading && !isDashboardError && dashboard && !isEmptyDataset && (
                <>
                    {/* Focused 5-Card KPI Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* 1. Total Deals */}
                        <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between shadow-2xs">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-[#6E6862]">
                                    {t('crm.dashboardSales.kpis.totalDeals')}
                                </span>
                                <div
                                    className="text-2xl font-bold text-[#0D0D0D] font-mono tabular-nums"
                                    dir="ltr"
                                >
                                    {dashboard.kpis.totalDeals}
                                </div>
                                <span className="text-[11px] text-[#6E6862] block tabular-nums">
                                    {t('crm.dashboardSales.kpis.totalDealsSub', {
                                        pipeline:
                                            dashboard.kpis.totalPipelineValue.toLocaleString(),
                                        avg: dashboard.kpis.averageDealSize.toLocaleString(),
                                    })}
                                </span>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-[#037F8C] flex items-center justify-center shrink-0">
                                <Briefcase size={17} />
                            </div>
                        </div>

                        {/* 2. Open Deals */}
                        <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between shadow-2xs">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-[#6E6862]">
                                    {t('crm.dashboardSales.kpis.openDeals')}
                                </span>
                                <div
                                    className="text-2xl font-bold text-[#037F8C] font-mono tabular-nums"
                                    dir="ltr"
                                >
                                    {dashboard.kpis.openDealsCount}
                                </div>
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t('crm.dashboardSales.kpis.openDealsSub')}
                                </span>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-[#037F8C]/10 text-[#037F8C] flex items-center justify-center shrink-0">
                                <TrendingUp size={17} />
                            </div>
                        </div>

                        {/* 3. Won Deals */}
                        <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between shadow-2xs">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-[#6E6862]">
                                    {t('crm.dashboardSales.kpis.wonDeals')}
                                </span>
                                <div
                                    className="text-2xl font-bold text-[#2E6B4E] font-mono tabular-nums"
                                    dir="ltr"
                                >
                                    {dashboard.kpis.wonDealsCount}
                                </div>
                                <span className="text-[11px] text-[#6E6862] block tabular-nums">
                                    {t('crm.dashboardSales.kpis.wonDealsSub', {
                                        revenue:
                                            dashboard.kpis.wonRevenue.toLocaleString(),
                                        winRate: dashboard.kpis.winRate,
                                    })}
                                </span>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-[#E9F5EE] text-[#2E6B4E] flex items-center justify-center shrink-0">
                                <Award size={17} />
                            </div>
                        </div>

                        {/* 4. Lost Deals */}
                        <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between shadow-2xs">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-[#6E6862]">
                                    {t('crm.dashboardSales.kpis.lostDeals')}
                                </span>
                                <div
                                    className="text-2xl font-bold text-[#A63A3A] font-mono tabular-nums"
                                    dir="ltr"
                                >
                                    {dashboard.kpis.lostDealsCount}
                                </div>
                                <span className="text-[11px] text-[#6E6862] block tabular-nums">
                                    {t('crm.dashboardSales.kpis.lostDealsSub', {
                                        convertedLeads:
                                            dashboard.kpis.convertedLeadsCount,
                                        totalLeads: dashboard.kpis.totalLeads,
                                    })}
                                </span>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-[#FDF2F2] text-[#A63A3A] flex items-center justify-center shrink-0">
                                <XCircle size={17} />
                            </div>
                        </div>

                        {/* 5. Open Pipeline Value */}
                        <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between shadow-2xs">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-[#6E6862]">
                                    {t(
                                        'crm.dashboardSales.kpis.openPipelineValue'
                                    )}
                                </span>
                                <div
                                    className="text-2xl font-bold text-[#0D0D0D] font-mono tabular-nums"
                                    dir="ltr"
                                >
                                    {dashboard.kpis.openPipelineValue.toLocaleString()}{' '}
                                    SAR
                                </div>
                                <span className="text-[11px] text-[#6E6862] block tabular-nums">
                                    {t(
                                        'crm.dashboardSales.kpis.openPipelineValueSub',
                                        {
                                            weighted:
                                                dashboard.kpis.weightedPipelineValue.toLocaleString(),
                                        }
                                    )}
                                </span>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-[#FBF4E9] text-[#A66E1E] flex items-center justify-center shrink-0">
                                <DollarSign size={17} />
                            </div>
                        </div>
                    </div>

                    {/* Charts Row: Deal-Stage Distribution & Monthly Sales Trend */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Deal-Stage Distribution Chart */}
                        <div className="rounded-2xl bg-white border border-[#E5E0D8] p-6 space-y-4 shadow-xs">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <h2 className="text-sm font-bold text-[#0D0D0D]">
                                        {t(
                                            'crm.dashboardSales.charts.stageDistributionTitle'
                                        )}
                                    </h2>
                                    <p className="text-xs text-[#6E6862]">
                                        {t(
                                            'crm.dashboardSales.charts.stageDistributionSubtitle'
                                        )}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigate('/crm/deals')}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#037F8C] hover:underline cursor-pointer whitespace-nowrap shrink-0"
                                >
                                    {t('crm.dashboardSales.nav.deals')}
                                    <ArrowUpRight size={13} />
                                </button>
                            </div>

                            {stageChartData.every(
                                (item) => item.dealsCount === 0
                            ) ? (
                                <div className="h-72 flex items-center justify-center text-xs text-[#6E6862] bg-[#FAF8F5] rounded-xl border border-dashed border-[#E5E0D8]">
                                    {t('crm.dashboardSales.states.noStageData')}
                                </div>
                            ) : (
                                <>
                                    <div className="h-64 w-full" dir="ltr">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <BarChart
                                                data={stageChartData}
                                                margin={{
                                                    top: 8,
                                                    right: 16,
                                                    left: 8,
                                                    bottom: 8,
                                                }}
                                            >
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    stroke="#E5E0D8"
                                                />
                                                <XAxis
                                                    dataKey="name"
                                                    tick={{
                                                        fontSize: 11,
                                                        fill: '#6E6862',
                                                    }}
                                                />
                                                <YAxis
                                                    tick={{
                                                        fontSize: 11,
                                                        fill: '#6E6862',
                                                    }}
                                                    tickFormatter={(val) =>
                                                        `${(Number(val) / 1000).toFixed(0)}k`
                                                    }
                                                />
                                                <Tooltip
                                                    formatter={(
                                                        value: unknown
                                                    ) =>
                                                        `${Number(value || 0).toLocaleString()} SAR`
                                                    }
                                                    contentStyle={{
                                                        borderRadius: '12px',
                                                        borderColor: '#E5E0D8',
                                                        fontSize: '12px',
                                                    }}
                                                />
                                                <Legend
                                                    wrapperStyle={{
                                                        fontSize: '12px',
                                                    }}
                                                />
                                                <Bar
                                                    dataKey="totalValue"
                                                    name={t(
                                                        'crm.dashboardSales.charts.series.expectedValue'
                                                    )}
                                                    fill="#037F8C"
                                                    radius={[6, 6, 0, 0]}
                                                />
                                                <Bar
                                                    dataKey="weightedValue"
                                                    name={t(
                                                        'crm.dashboardSales.charts.series.weightedValue'
                                                    )}
                                                    fill="#2E6B4E"
                                                    radius={[6, 6, 0, 0]}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Compact Stage Summary Strip */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-[#E5E0D8]">
                                        {stageChartData.map((st) => (
                                            <div
                                                key={st.stage}
                                                className="px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]/70 space-y-0.5"
                                            >
                                                <div className="flex items-center justify-between gap-1">
                                                    <span className="text-[11px] font-bold text-[#0D0D0D] truncate">
                                                        {st.name}
                                                    </span>
                                                    <span
                                                        className="text-[11px] font-mono font-bold text-[#037F8C] tabular-nums"
                                                        dir="ltr"
                                                    >
                                                        {st.totalValue.toLocaleString()}{' '}
                                                        SAR
                                                    </span>
                                                </div>
                                                <div className="text-[10px] text-[#6E6862] tabular-nums">
                                                    {t(
                                                        'crm.dashboardSales.charts.stageMeta',
                                                        {
                                                            count: st.dealsCount,
                                                            share: st.shareOfPipeline,
                                                            prob: st.averageProbability,
                                                        }
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Monthly Sales Trend Chart */}
                        <div className="rounded-2xl bg-white border border-[#E5E0D8] p-6 space-y-4 shadow-xs">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <h2 className="text-sm font-bold text-[#0D0D0D]">
                                        {t(
                                            'crm.dashboardSales.charts.monthlyTrendTitle'
                                        )}
                                    </h2>
                                    <p className="text-xs text-[#6E6862]">
                                        {t(
                                            'crm.dashboardSales.charts.monthlyTrendSubtitle'
                                        )}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigate('/crm/won-deals')}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#2E6B4E] hover:underline cursor-pointer whitespace-nowrap shrink-0"
                                >
                                    {t('crm.dashboardSales.nav.wonDeals')}
                                    <ArrowUpRight size={13} />
                                </button>
                            </div>

                            {dashboard.monthlyTrends.length === 0 ? (
                                <div className="h-72 flex items-center justify-center text-xs text-[#6E6862] bg-[#FAF8F5] rounded-xl border border-dashed border-[#E5E0D8]">
                                    {t('crm.dashboardSales.states.noTrendData')}
                                </div>
                            ) : (
                                <>
                                    <div className="h-64 w-full" dir="ltr">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <AreaChart
                                                data={dashboard.monthlyTrends}
                                                margin={{
                                                    top: 8,
                                                    right: 16,
                                                    left: 8,
                                                    bottom: 8,
                                                }}
                                            >
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    stroke="#E5E0D8"
                                                />
                                                <XAxis
                                                    dataKey="period"
                                                    tick={{
                                                        fontSize: 11,
                                                        fill: '#6E6862',
                                                    }}
                                                />
                                                <YAxis
                                                    tick={{
                                                        fontSize: 11,
                                                        fill: '#6E6862',
                                                    }}
                                                    tickFormatter={(val) =>
                                                        `${(Number(val) / 1000).toFixed(0)}k`
                                                    }
                                                />
                                                <Tooltip
                                                    formatter={(
                                                        value: unknown
                                                    ) =>
                                                        `${Number(value || 0).toLocaleString()} SAR`
                                                    }
                                                    contentStyle={{
                                                        borderRadius: '12px',
                                                        borderColor: '#E5E0D8',
                                                        fontSize: '12px',
                                                    }}
                                                />
                                                <Legend
                                                    wrapperStyle={{
                                                        fontSize: '12px',
                                                    }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="pipelineAddedValue"
                                                    name={t(
                                                        'crm.dashboardSales.charts.series.pipelineAdded'
                                                    )}
                                                    stroke="#037F8C"
                                                    fill="#037F8C"
                                                    fillOpacity={0.14}
                                                    strokeWidth={2}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="wonDealValue"
                                                    name={t(
                                                        'crm.dashboardSales.charts.series.wonDealValue'
                                                    )}
                                                    stroke="#2E6B4E"
                                                    fill="#2E6B4E"
                                                    fillOpacity={0.22}
                                                    strokeWidth={2}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Monthly Trend Table Strip */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-[#E5E0D8]">
                                        {dashboard.monthlyTrends
                                            .slice(-6)
                                            .map((pt) => (
                                                <div
                                                    key={pt.period}
                                                    className="px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]/70 space-y-0.5"
                                                >
                                                    <div className="flex items-center justify-between gap-1">
                                                        <span
                                                            className="text-[11px] font-mono font-bold text-[#0D0D0D] tabular-nums"
                                                            dir="ltr"
                                                        >
                                                            {pt.period}
                                                        </span>
                                                        <span
                                                            className="text-[11px] font-mono font-bold text-[#2E6B4E] tabular-nums"
                                                            dir="ltr"
                                                        >
                                                            {pt.wonDealValue.toLocaleString()}{' '}
                                                            SAR
                                                        </span>
                                                    </div>
                                                    <div
                                                        className="text-[10px] font-mono text-[#6E6862] tabular-nums"
                                                        dir="ltr"
                                                    >
                                                        +{pt.dealsCreatedCount}{' '}
                                                        {t(
                                                            'crm.dashboardSales.charts.series.dealsCount'
                                                        )}{' '}
                                                        ·{' '}
                                                        {pt.pipelineAddedValue.toLocaleString()}{' '}
                                                        SAR
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Recent & Upcoming Sales Activities Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* 1. Upcoming & Recent Sales Operational Tasks */}
                        <div className="rounded-2xl bg-white border border-[#E5E0D8] overflow-hidden shadow-xs flex flex-col">
                            <div className="p-5 border-b border-[#E5E0D8] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-sm font-bold text-[#0D0D0D]">
                                            {t(
                                                'crm.dashboardSales.activities.tasksTitle'
                                            )}
                                        </h2>
                                        <span className="text-[11px] font-mono text-[#6E6862] tabular-nums">
                                            ·{' '}
                                            {t(
                                                'crm.dashboardSales.activities.openTasksCount',
                                                {
                                                    open: openTasksCount,
                                                    total: filteredTasks.length,
                                                }
                                            )}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#6E6862]">
                                        {t(
                                            'crm.dashboardSales.activities.tasksSubtitle'
                                        )}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate('/crm/operational-task')
                                    }
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#037F8C] hover:underline cursor-pointer whitespace-nowrap shrink-0"
                                >
                                    {t(
                                        'crm.dashboardSales.activities.viewAllTasks'
                                    )}
                                    <ArrowUpRight size={13} />
                                </button>
                            </div>

                            {filteredTasks.length === 0 ? (
                                <div className="p-8 text-center text-xs text-[#6E6862]">
                                    {t('crm.dashboardSales.activities.noTasks')}
                                </div>
                            ) : (
                                <div className="divide-y divide-[#E5E0D8]">
                                    {filteredTasks.slice(0, 6).map((task) => {
                                        const isUrgentOrHigh =
                                            task.priority === 'Urgent' ||
                                            task.priority === 'High';
                                        const isCompleted =
                                            task.taskStatus === 'Completed';
                                        return (
                                            <div
                                                key={task.id}
                                                onClick={() =>
                                                    navigate(
                                                        '/crm/operational-task'
                                                    )
                                                }
                                                className="p-4 hover:bg-[#FAF8F5]/70 transition-colors cursor-pointer flex items-start justify-between gap-4"
                                            >
                                                <div className="space-y-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#6E6862]">
                                                        <span
                                                            className="font-mono font-semibold text-[#037F8C]"
                                                            dir="ltr"
                                                        >
                                                            {task.code}
                                                        </span>
                                                        <span aria-hidden="true">
                                                            ·
                                                        </span>
                                                        <span
                                                            className={
                                                                isUrgentOrHigh
                                                                    ? 'font-bold text-[#A63A3A]'
                                                                    : 'font-medium text-[#6E6862]'
                                                            }
                                                        >
                                                            {t(
                                                                `crm.dashboardSales.activities.priorities.${task.priority}`,
                                                                {
                                                                    defaultValue:
                                                                        task.priority,
                                                                }
                                                            )}
                                                        </span>
                                                        <span aria-hidden="true">
                                                            ·
                                                        </span>
                                                        <span className="truncate">
                                                            {task.relatedEntityType}
                                                            :{' '}
                                                            {isRtl
                                                                ? task.relatedEntityNameAr ||
                                                                  task.relatedEntityNameEn
                                                                : task.relatedEntityNameEn}
                                                        </span>
                                                    </div>

                                                    <div className="text-xs font-bold text-[#0D0D0D] truncate">
                                                        {isRtl
                                                            ? task.titleAr ||
                                                              task.titleEn
                                                            : task.titleEn}
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#6E6862]">
                                                        <span>
                                                            {isRtl
                                                                ? task.assignedSpecialistNameAr ||
                                                                  task.assignedSpecialistNameEn
                                                                : task.assignedSpecialistNameEn}
                                                        </span>
                                                        <span aria-hidden="true">
                                                            ·
                                                        </span>
                                                        <span
                                                            className={
                                                                isCompleted
                                                                    ? 'font-semibold text-[#2E6B4E]'
                                                                    : 'font-semibold text-[#A66E1E]'
                                                            }
                                                        >
                                                            {t(
                                                                `crm.dashboardSales.activities.taskStatuses.${task.taskStatus}`,
                                                                {
                                                                    defaultValue:
                                                                        task.taskStatus,
                                                                }
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="text-end shrink-0 space-y-1">
                                                    <div
                                                        className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-[#0D0D0D] tabular-nums"
                                                        dir="ltr"
                                                    >
                                                        <Clock
                                                            size={12}
                                                            className="text-[#6E6862]"
                                                        />
                                                        {task.dueDate}
                                                    </div>
                                                    <div className="text-[10px] text-[#6E6862]">
                                                        {t(
                                                            'crm.dashboardSales.activities.due'
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* 2. Active Pipeline & Upcoming Deal Closings */}
                        <div className="rounded-2xl bg-white border border-[#E5E0D8] overflow-hidden shadow-xs flex flex-col">
                            <div className="p-5 border-b border-[#E5E0D8] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-sm font-bold text-[#0D0D0D]">
                                        {t(
                                            'crm.dashboardSales.activities.dealsTitle'
                                        )}
                                    </h2>
                                    <p className="text-xs text-[#6E6862]">
                                        {t(
                                            'crm.dashboardSales.activities.dealsSubtitle'
                                        )}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => navigate('/crm/deals')}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#037F8C] hover:underline cursor-pointer whitespace-nowrap shrink-0"
                                >
                                    {t(
                                        'crm.dashboardSales.activities.viewAllDeals'
                                    )}
                                    <ArrowUpRight size={13} />
                                </button>
                            </div>

                            {recentAndUpcomingDeals.length === 0 ? (
                                <div className="p-8 text-center text-xs text-[#6E6862]">
                                    {t('crm.dashboardSales.activities.noDeals')}
                                </div>
                            ) : (
                                <div className="divide-y divide-[#E5E0D8]">
                                    {recentAndUpcomingDeals.map((deal) => {
                                        const isWon = deal.stage === 'won';
                                        const isLost = deal.stage === 'lost';
                                        return (
                                            <div
                                                key={deal.id}
                                                onClick={() =>
                                                    navigate(
                                                        isWon
                                                            ? '/crm/won-deals'
                                                            : '/crm/deals'
                                                    )
                                                }
                                                className="p-4 hover:bg-[#FAF8F5]/70 transition-colors cursor-pointer flex items-start justify-between gap-4"
                                            >
                                                <div className="space-y-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#6E6862]">
                                                        <span
                                                            className="font-mono font-semibold text-[#037F8C]"
                                                            dir="ltr"
                                                        >
                                                            {deal.code}
                                                        </span>
                                                        <span aria-hidden="true">
                                                            ·
                                                        </span>
                                                        <span className="truncate font-medium text-[#0D0D0D]">
                                                            {isRtl
                                                                ? deal.companyNameAr ||
                                                                  deal.companyNameEn
                                                                : deal.companyNameEn}
                                                        </span>
                                                        <span aria-hidden="true">
                                                            ·
                                                        </span>
                                                        <span
                                                            className={
                                                                isWon
                                                                    ? 'font-bold text-[#2E6B4E]'
                                                                    : isLost
                                                                      ? 'font-bold text-[#A63A3A]'
                                                                      : 'font-semibold text-[#A66E1E]'
                                                            }
                                                        >
                                                            {translateStage(
                                                                deal.stage
                                                            )}
                                                        </span>
                                                    </div>

                                                    <div className="text-xs font-bold text-[#0D0D0D] truncate">
                                                        {isRtl
                                                            ? deal.titleAr ||
                                                              deal.titleEn
                                                            : deal.titleEn}
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#6E6862] tabular-nums">
                                                        <span>
                                                            {isRtl
                                                                ? deal.assignedEmployeeNameAr ||
                                                                  deal.assignedEmployeeNameEn
                                                                : deal.assignedEmployeeNameEn}
                                                        </span>
                                                        <span aria-hidden="true">
                                                            ·
                                                        </span>
                                                        <span
                                                            className="font-mono"
                                                            dir="ltr"
                                                        >
                                                            {t(
                                                                'crm.dashboardSales.activities.probability'
                                                            )}{' '}
                                                            {deal.probability ??
                                                                0}
                                                            %
                                                        </span>
                                                        {deal.expectedCloseDate && (
                                                            <>
                                                                <span aria-hidden="true">
                                                                    ·
                                                                </span>
                                                                <span
                                                                    className="font-mono"
                                                                    dir="ltr"
                                                                >
                                                                    {t(
                                                                        'crm.dashboardSales.activities.closeDate'
                                                                    )}
                                                                    :{' '}
                                                                    {
                                                                        deal.expectedCloseDate
                                                                    }
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="text-end shrink-0 space-y-1">
                                                    <div
                                                        className={`text-xs font-mono font-bold tabular-nums ${
                                                            isWon
                                                                ? 'text-[#2E6B4E]'
                                                                : 'text-[#0D0D0D]'
                                                        }`}
                                                        dir="ltr"
                                                    >
                                                        {(
                                                            deal.expectedValue ||
                                                            0
                                                        ).toLocaleString()}{' '}
                                                        SAR
                                                    </div>
                                                    <div className="text-[10px] text-[#6E6862] font-mono tabular-nums">
                                                        {deal.wonAt ||
                                                            deal.expectedCloseDate ||
                                                            deal.createdAt}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
