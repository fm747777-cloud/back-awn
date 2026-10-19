import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import {
    Award,
    TrendingUp,
    FileCheck2,
    Receipt,
    Users,
    FileText,
    Briefcase,
    AlertTriangle,
    RotateCcw,
    RefreshCw,
    Download,
    CheckCircle2,
    Calendar,
    Building2,
    Layers,
    UserCheck,
    ArrowUpRight,
} from 'lucide-react';
import { crmApi, CRM_SALES_EMPLOYEES } from '../../api/api';
import { useCrmSalesPerformanceDashboardQuery } from '../../components/crm/shared/useCrmWorkflowQueries';
import type { CrmDealStage } from '../../schemas/crmSchema';

export const SalesPerformanceDashboardPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    // Filter state supported by crmApi.getSalesPerformanceDashboard
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [employeeFilter, setEmployeeFilter] = useState<string>('all');
    const [sectorFilter, setSectorFilter] = useState<string>('all');
    const [companyFilter, setCompanyFilter] = useState<string>('all');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const queryFilters = useMemo(
        () => ({
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
            assignedEmployeeId: employeeFilter,
            sectorId: sectorFilter,
            companyId: companyFilter,
        }),
        [dateFrom, dateTo, employeeFilter, sectorFilter, companyFilter]
    );

    const {
        data: dashboard,
        isLoading,
        isFetching,
        isError,
        error,
        refetch,
    } = useCrmSalesPerformanceDashboardQuery(queryFilters);

    const { data: companiesRes } = useQuery({
        queryKey: ['crm', 'companies', 'lookup'],
        queryFn: () => crmApi.companies.getAll({ limit: 200 }),
    });

    const { data: sectorsRes } = useQuery({
        queryKey: ['crm', 'sectors', 'lookup'],
        queryFn: () => crmApi.getSectors({ limit: 200 }),
    });

    const companies = companiesRes?.data || [];
    const sectors = sectorsRes?.data || [];

    const hasActiveFilters =
        Boolean(dateFrom) ||
        Boolean(dateTo) ||
        employeeFilter !== 'all' ||
        sectorFilter !== 'all' ||
        companyFilter !== 'all';

    const showToast = (msg: string) => {
        setToastMessage(msg);
        window.setTimeout(() => setToastMessage(null), 3500);
    };

    const handleRefresh = async () => {
        await refetch();
        showToast(t('crm.salesPerformanceDashboard.refreshedToast'));
    };

    const handleResetFilters = () => {
        setDateFrom('');
        setDateTo('');
        setEmployeeFilter('all');
        setSectorFilter('all');
        setCompanyFilter('all');
    };

    const handleExportRepCsv = () => {
        if (!dashboard) return;
        const headers = [
            'Employee Code',
            'Sales Representative (EN)',
            'Sales Representative (AR)',
            'Role',
            'Leads Count',
            'Converted Leads',
            'Lead Conversion Rate (%)',
            'Total Deals',
            'Open Deals',
            'Won Deals',
            'Lost Deals',
            'Win Rate (%)',
            'Pipeline Value (SAR)',
            'Weighted Pipeline Value (SAR)',
            'Won Revenue (SAR)',
            'Quotations Count',
            'Quoted Value (SAR)',
            'Contracts Count',
            'Contracted Value (SAR)',
            'Invoiced Amount (SAR)',
            'Collected Amount (SAR)',
            'Outstanding Balance (SAR)',
            'Collection Rate (%)',
        ];

        const rows = dashboard.repPerformance.map((rep) => [
            rep.employeeCode,
            `"${rep.nameEn.replace(/"/g, '""')}"`,
            `"${rep.nameAr.replace(/"/g, '""')}"`,
            `"${rep.roleEn.replace(/"/g, '""')}"`,
            String(rep.leadsCount),
            String(rep.convertedLeadsCount),
            String(rep.leadConversionRate),
            String(rep.dealsCount),
            String(rep.openDealsCount),
            String(rep.wonDealsCount),
            String(rep.lostDealsCount),
            String(rep.winRate),
            String(rep.pipelineValue),
            String(rep.weightedPipelineValue),
            String(rep.wonValue),
            String(rep.quotationsCount),
            String(rep.quotedValue),
            String(rep.contractsCount),
            String(rep.contractedValue),
            String(rep.invoicedAmount),
            String(rep.collectedAmount),
            String(rep.outstandingAmount),
            String(rep.collectionRate),
        ]);

        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join(
            '\n'
        );
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `awn-crm-sales-performance-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        showToast(
            t('crm.salesPerformanceDashboard.exportedCsv', {
                count: dashboard.repPerformance.length,
            })
        );
    };

    const translateStage = useCallback(
        (stage: CrmDealStage) =>
            t(`crm.commercial.deals.stages.${stage}`, { defaultValue: stage }),
        [t]
    );

    const translateOnboardingStatus = (status: string) =>
        t(`crm.companies.onboardingStatuses.${status}`, {
            defaultValue: status,
        });

    const repChartData = useMemo(() => {
        if (!dashboard) return [];
        return dashboard.repPerformance.map((rep) => ({
            name: isRtl ? rep.nameAr : rep.nameEn,
            pipelineValue: rep.pipelineValue,
            wonValue: rep.wonValue,
            collectedAmount: rep.collectedAmount,
        }));
    }, [dashboard, isRtl]);

    const stageChartData = useMemo(() => {
        if (!dashboard) return [];
        return dashboard.stageBreakdown.map((item) => ({
            name: translateStage(item.stage),
            stage: item.stage,
            dealsCount: item.dealsCount,
            totalValue: item.totalValue,
            weightedValue: item.weightedValue,
            shareOfPipeline: item.shareOfPipeline,
        }));
    }, [dashboard, translateStage]);

    const sectorChartData = useMemo(() => {
        if (!dashboard) return [];
        return dashboard.sectorPerformance.map((sec) => ({
            name: isRtl ? sec.sectorNameAr : sec.sectorNameEn,
            pipelineValue: sec.pipelineValue,
            wonValue: sec.wonValue,
            invoicedAmount: sec.invoicedAmount,
            collectedAmount: sec.collectedAmount,
        }));
    }, [dashboard, isRtl]);

    const isEmptyDataset =
        dashboard &&
        dashboard.kpis.totalDeals === 0 &&
        dashboard.kpis.totalLeads === 0 &&
        dashboard.kpis.totalQuotations === 0 &&
        dashboard.kpis.totalContracts === 0 &&
        dashboard.kpis.totalInvoices === 0;

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6 text-start">
            {toastMessage && (
                <div className="fixed bottom-5 end-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border bg-[#E9F5EE] border-[#2E6B4E]/30 text-[#2E6B4E] text-xs font-semibold">
                    <CheckCircle2 size={16} />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white rounded-2xl border border-[#E5E0D8] p-6 shadow-xs">
                <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className="px-2.5 py-0.5 rounded-md bg-[#037F8C]/10 border border-[#037F8C]/20 text-xs font-mono font-bold text-[#037F8C]"
                            dir="ltr"
                        >
                            {t('crm.salesPerformanceDashboard.badge')}
                        </span>
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.groups.main')}
                        </span>
                        {dashboard?.generatedAt && (
                            <span
                                className="text-[11px] font-mono text-[#857E74] ps-2 border-s border-[#E5E0D8]"
                                dir="ltr"
                            >
                                {t('crm.salesPerformanceDashboard.lastUpdated')}
                                :{' '}
                                {new Date(
                                    dashboard.generatedAt
                                ).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-[#0D0D0D]">
                        {t('crm.pages.salesPerformanceDashboard.title')}
                    </h1>
                    <p className="text-xs text-[#6E6862]">
                        {t('crm.pages.salesPerformanceDashboard.subtitle')}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => navigate('/crm/won-deals')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-white text-xs font-semibold text-[#037F8C] transition-colors cursor-pointer"
                    >
                        <Award size={14} />
                        {t('crm.salesPerformanceDashboard.quickLinks.viewWonDeals')}
                        <ArrowUpRight size={13} />
                    </button>

                    <button
                        type="button"
                        onClick={handleExportRepCsv}
                        disabled={!dashboard || dashboard.repPerformance.length === 0}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] disabled:opacity-50 text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                    >
                        <Download size={14} />
                        {t('crm.salesPerformanceDashboard.exportCsv')}
                    </button>

                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={isFetching}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#037F8C] hover:bg-[#233222] disabled:opacity-60 text-xs font-semibold text-[#FAF8F5] transition-colors cursor-pointer"
                    >
                        <RefreshCw
                            size={14}
                            className={isFetching ? 'animate-spin' : ''}
                        />
                        {isFetching
                            ? t('crm.salesPerformanceDashboard.refreshing')
                            : t('crm.salesPerformanceDashboard.refresh')}
                    </button>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="rounded-2xl bg-white border border-[#E5E0D8] p-4 space-y-3 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Calendar size={15} className="text-[#037F8C]" />
                        <span className="text-xs font-bold text-[#0D0D0D]">
                            {t('crm.salesPerformanceDashboard.filters.title')}
                        </span>
                        {hasActiveFilters && (
                            <span className="px-2 py-0.5 rounded-md bg-[#2E6B4E]/10 text-[#2E6B4E] text-[11px] font-semibold">
                                {t(
                                    'crm.salesPerformanceDashboard.filters.activeFilters'
                                )}
                            </span>
                        )}
                    </div>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer self-start sm:self-auto"
                        >
                            <RotateCcw size={13} />
                            {t('crm.salesPerformanceDashboard.filters.reset')}
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                    <div>
                        <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                            {t('crm.salesPerformanceDashboard.filters.dateFrom')}
                        </label>
                        <input
                            type="date"
                            value={dateFrom}
                            max={dateTo || undefined}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] font-mono focus:outline-none focus:bg-white focus:border-[#037F8C]"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                            {t('crm.salesPerformanceDashboard.filters.dateTo')}
                        </label>
                        <input
                            type="date"
                            value={dateTo}
                            min={dateFrom || undefined}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] font-mono focus:outline-none focus:bg-white focus:border-[#037F8C]"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                            {t('crm.salesPerformanceDashboard.tables.columns.rep')}
                        </label>
                        <select
                            value={employeeFilter}
                            onChange={(e) => setEmployeeFilter(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                        >
                            <option value="all">
                                {t('crm.salesPerformanceDashboard.filters.allReps')}
                            </option>
                            {CRM_SALES_EMPLOYEES.map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                    {isRtl ? emp.nameAr : emp.nameEn}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                            {t('crm.salesPerformanceDashboard.tables.columns.sector')}
                        </label>
                        <select
                            value={sectorFilter}
                            onChange={(e) => setSectorFilter(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                        >
                            <option value="all">
                                {t(
                                    'crm.salesPerformanceDashboard.filters.allSectors'
                                )}
                            </option>
                            {sectors.map((sec) => (
                                <option key={sec.id} value={sec.id}>
                                    {isRtl ? sec.nameAr : sec.nameEn}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                            {t(
                                'crm.salesPerformanceDashboard.tables.columns.company'
                            )}
                        </label>
                        <select
                            value={companyFilter}
                            onChange={(e) => setCompanyFilter(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                        >
                            <option value="all">
                                {t(
                                    'crm.salesPerformanceDashboard.filters.allCompanies'
                                )}
                            </option>
                            {companies.map((comp) => (
                                <option key={comp.id} value={comp.id}>
                                    {isRtl ? comp.nameAr : comp.nameEn}
                                </option>
                            ))}
                        </select>
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
                        {t('crm.salesPerformanceDashboard.states.loadingTitle')}
                    </h2>
                    <p className="text-xs text-[#6E6862] max-w-md mx-auto">
                        {t(
                            'crm.salesPerformanceDashboard.states.loadingSubtitle'
                        )}
                    </p>
                </div>
            )}

            {/* Error State */}
            {!isLoading && isError && (
                <div className="rounded-2xl bg-white border border-[#A63A3A]/30 p-10 text-center space-y-3 shadow-xs">
                    <div className="w-11 h-11 rounded-xl bg-[#FDF2F2] text-[#A63A3A] flex items-center justify-center mx-auto">
                        <AlertTriangle size={20} />
                    </div>
                    <h2 className="text-sm font-bold text-[#0D0D0D]">
                        {t('crm.salesPerformanceDashboard.states.errorTitle')}
                    </h2>
                    <p className="text-xs text-[#6E6862] max-w-md mx-auto">
                        {error instanceof Error
                            ? error.message
                            : t(
                                  'crm.salesPerformanceDashboard.states.errorSubtitle'
                              )}
                    </p>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#037F8C] text-[#FAF8F5] text-xs font-semibold cursor-pointer"
                    >
                        <RefreshCw size={13} />
                        {t('crm.salesPerformanceDashboard.states.retry')}
                    </button>
                </div>
            )}

            {/* Empty State when filters return 0 records across all commercial entities */}
            {!isLoading && !isError && isEmptyDataset && (
                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-12 text-center space-y-3 shadow-xs">
                    <div className="w-11 h-11 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-[#6E6862] flex items-center justify-center mx-auto">
                        <Briefcase size={20} />
                    </div>
                    <h2 className="text-sm font-bold text-[#0D0D0D]">
                        {t('crm.salesPerformanceDashboard.states.emptyTitle')}
                    </h2>
                    <p className="text-xs text-[#6E6862] max-w-md mx-auto">
                        {t(
                            'crm.salesPerformanceDashboard.states.emptySubtitle'
                        )}
                    </p>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-white text-xs font-semibold text-[#0D0D0D] cursor-pointer"
                        >
                            <RotateCcw size={13} />
                            {t('crm.salesPerformanceDashboard.filters.reset')}
                        </button>
                    )}
                </div>
            )}

            {/* Main Dashboard Content */}
            {!isLoading && !isError && dashboard && !isEmptyDataset && (
                <>
                    {/* Row 1: Primary Revenue & Pipeline KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Closed-Won Revenue */}
                        <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between shadow-2xs">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-[#6E6862]">
                                    {t(
                                        'crm.salesPerformanceDashboard.kpis.wonRevenue'
                                    )}
                                </span>
                                <div
                                    className="text-2xl font-bold text-[#2E6B4E] font-mono"
                                    dir="ltr"
                                >
                                    {dashboard.kpis.wonRevenue.toLocaleString()}{' '}
                                    SAR
                                </div>
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t(
                                        'crm.salesPerformanceDashboard.kpis.wonRevenueSub',
                                        {
                                            wonCount:
                                                dashboard.kpis.wonDealsCount,
                                            totalDeals:
                                                dashboard.kpis.totalDeals,
                                            winRate: dashboard.kpis.winRate,
                                        }
                                    )}
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-[#E9F5EE] text-[#2E6B4E] flex items-center justify-center shrink-0">
                                <Award size={19} />
                            </div>
                        </div>

                        {/* Weighted Pipeline Value */}
                        <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between shadow-2xs">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-[#6E6862]">
                                    {t(
                                        'crm.salesPerformanceDashboard.kpis.weightedPipeline'
                                    )}
                                </span>
                                <div
                                    className="text-2xl font-bold text-[#037F8C] font-mono"
                                    dir="ltr"
                                >
                                    {dashboard.kpis.weightedPipelineValue.toLocaleString()}{' '}
                                    SAR
                                </div>
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t(
                                        'crm.salesPerformanceDashboard.kpis.weightedPipelineSub',
                                        {
                                            openCount:
                                                dashboard.kpis.openDealsCount,
                                            totalPipeline:
                                                dashboard.kpis.totalPipelineValue.toLocaleString(),
                                        }
                                    )}
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-[#037F8C]/10 text-[#037F8C] flex items-center justify-center shrink-0">
                                <TrendingUp size={19} />
                            </div>
                        </div>

                        {/* Contracted Value */}
                        <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between shadow-2xs">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-[#6E6862]">
                                    {t(
                                        'crm.salesPerformanceDashboard.kpis.contractedCoverage'
                                    )}
                                </span>
                                <div
                                    className="text-2xl font-bold text-[#0891B2] font-mono"
                                    dir="ltr"
                                >
                                    {dashboard.kpis.totalContractedValue.toLocaleString()}{' '}
                                    SAR
                                </div>
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t(
                                        'crm.salesPerformanceDashboard.kpis.contractedCoverageSub',
                                        {
                                            activeCount:
                                                dashboard.kpis
                                                    .activeContractsCount,
                                            totalCount:
                                                dashboard.kpis.totalContracts,
                                        }
                                    )}
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-[#0891B2] flex items-center justify-center shrink-0">
                                <FileCheck2 size={19} />
                            </div>
                        </div>

                        {/* Collected Invoice Revenue */}
                        <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between shadow-2xs">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-[#6E6862]">
                                    {t(
                                        'crm.salesPerformanceDashboard.kpis.collectedRevenue'
                                    )}
                                </span>
                                <div
                                    className="text-2xl font-bold text-[#2E6B4E] font-mono"
                                    dir="ltr"
                                >
                                    {dashboard.kpis.totalCollectedAmount.toLocaleString()}{' '}
                                    SAR
                                </div>
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t(
                                        'crm.salesPerformanceDashboard.kpis.collectedRevenueSub',
                                        {
                                            collectionRate:
                                                dashboard.kpis.collectionRate,
                                            invoiced:
                                                dashboard.kpis.totalInvoicedAmount.toLocaleString(),
                                        }
                                    )}
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-[#E9F5EE] text-[#2E6B4E] flex items-center justify-center shrink-0">
                                <Receipt size={19} />
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Conversion & Efficiency KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Lead Conversion Rate */}
                        <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between shadow-2xs">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-[#6E6862]">
                                    {t(
                                        'crm.salesPerformanceDashboard.kpis.leadConversion'
                                    )}
                                </span>
                                <div
                                    className="text-2xl font-bold text-[#0D0D0D] font-mono"
                                    dir="ltr"
                                >
                                    {dashboard.kpis.leadConversionRate}%
                                </div>
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t(
                                        'crm.salesPerformanceDashboard.kpis.leadConversionSub',
                                        {
                                            converted:
                                                dashboard.kpis
                                                    .convertedLeadsCount,
                                            qualified:
                                                dashboard.kpis
                                                    .qualifiedLeadsCount,
                                            total: dashboard.kpis.totalLeads,
                                        }
                                    )}
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-[#037F8C] flex items-center justify-center shrink-0">
                                <Users size={19} />
                            </div>
                        </div>

                        {/* Quotation Acceptance Rate */}
                        <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between shadow-2xs">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-[#6E6862]">
                                    {t(
                                        'crm.salesPerformanceDashboard.kpis.quotationAcceptance'
                                    )}
                                </span>
                                <div
                                    className="text-2xl font-bold text-[#0D0D0D] font-mono"
                                    dir="ltr"
                                >
                                    {dashboard.kpis.quotationAcceptanceRate}%
                                </div>
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t(
                                        'crm.salesPerformanceDashboard.kpis.quotationAcceptanceSub',
                                        {
                                            accepted:
                                                dashboard.kpis
                                                    .acceptedQuotationsCount,
                                            total:
                                                dashboard.kpis.totalQuotations,
                                            value:
                                                dashboard.kpis.acceptedQuotedValue.toLocaleString(),
                                        }
                                    )}
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-[#6A7358] flex items-center justify-center shrink-0">
                                <FileText size={19} />
                            </div>
                        </div>

                        {/* Average Won Deal Size */}
                        <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between shadow-2xs">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-[#6E6862]">
                                    {t(
                                        'crm.salesPerformanceDashboard.kpis.avgWonDealSize'
                                    )}
                                </span>
                                <div
                                    className="text-2xl font-bold text-[#037F8C] font-mono"
                                    dir="ltr"
                                >
                                    {dashboard.kpis.averageWonDealSize.toLocaleString()}{' '}
                                    SAR
                                </div>
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t(
                                        'crm.salesPerformanceDashboard.kpis.avgWonDealSizeSub',
                                        {
                                            wonCount:
                                                dashboard.kpis.wonDealsCount,
                                            avgAll:
                                                dashboard.kpis.averageDealSize.toLocaleString(),
                                        }
                                    )}
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-[#037F8C] flex items-center justify-center shrink-0">
                                <Briefcase size={19} />
                            </div>
                        </div>

                        {/* Outstanding Receivables */}
                        <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between shadow-2xs">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-[#6E6862]">
                                    {t(
                                        'crm.salesPerformanceDashboard.kpis.outstandingReceivables'
                                    )}
                                </span>
                                <div
                                    className="text-2xl font-bold text-[#B45309] font-mono"
                                    dir="ltr"
                                >
                                    {dashboard.kpis.totalOutstandingAmount.toLocaleString()}{' '}
                                    SAR
                                </div>
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t(
                                        'crm.salesPerformanceDashboard.kpis.outstandingReceivablesSub',
                                        {
                                            overdue:
                                                dashboard.kpis.overdueAmount.toLocaleString(),
                                            invoiceCount:
                                                dashboard.kpis.totalInvoices,
                                        }
                                    )}
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#B45309] flex items-center justify-center shrink-0">
                                <AlertTriangle size={19} />
                            </div>
                        </div>
                    </div>

                    {/* Charts Row 1: Monthly Commercial Progression & Rep Attainment */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Monthly Commercial & Revenue Trend */}
                        <div className="bg-white border border-[#E5E0D8] rounded-2xl shadow-2xs overflow-hidden">
                            <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-4">
                                <h2 className="text-xs font-bold text-[#0D0D0D] tracking-wide uppercase">
                                    {t(
                                        'crm.salesPerformanceDashboard.charts.monthlyTrendTitle'
                                    )}
                                </h2>
                                <p className="text-[11px] text-[#6E6862] mt-0.5">
                                    {t(
                                        'crm.salesPerformanceDashboard.charts.monthlyTrendSubtitle'
                                    )}
                                </p>
                            </div>
                            <div className="p-6" dir="ltr">
                                {dashboard.monthlyTrends.length === 0 ? (
                                    <div className="h-72 flex items-center justify-center text-xs text-[#6E6862]">
                                        {t(
                                            'crm.salesPerformanceDashboard.states.noTrendData'
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-72 w-full">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <BarChart
                                                data={dashboard.monthlyTrends}
                                                margin={{
                                                    top: 12,
                                                    right: 20,
                                                    left: 10,
                                                    bottom: 12,
                                                }}
                                            >
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    vertical={false}
                                                    stroke="#EFECE6"
                                                />
                                                <XAxis
                                                    dataKey="period"
                                                    tick={{
                                                        fill: '#6E6862',
                                                        fontSize: 11,
                                                    }}
                                                />
                                                <YAxis
                                                    tick={{
                                                        fill: '#6E6862',
                                                        fontSize: 11,
                                                    }}
                                                    tickFormatter={(v) =>
                                                        `${Math.round(Number(v) / 1000)}k`
                                                    }
                                                />
                                                <Tooltip
                                                    cursor={{
                                                        fill: '#F8F6F2',
                                                    }}
                                                    formatter={(val: any) => [
                                                        `${Number(val).toLocaleString()} SAR`,
                                                    ]}
                                                    contentStyle={{
                                                        backgroundColor:
                                                            '#0D0D0D',
                                                        borderColor: '#037F8C',
                                                        borderRadius: '10px',
                                                        color: '#FAF8F5',
                                                        fontSize: '12px',
                                                    }}
                                                />
                                                <Legend
                                                    wrapperStyle={{
                                                        fontSize: '11px',
                                                    }}
                                                />
                                                <Bar
                                                    dataKey="pipelineAddedValue"
                                                    name={t(
                                                        'crm.salesPerformanceDashboard.charts.series.pipelineAdded'
                                                    )}
                                                    fill="#6A7358"
                                                    radius={[4, 4, 0, 0]}
                                                />
                                                <Bar
                                                    dataKey="wonDealValue"
                                                    name={t(
                                                        'crm.salesPerformanceDashboard.charts.series.wonDealValue'
                                                    )}
                                                    fill="#037F8C"
                                                    radius={[4, 4, 0, 0]}
                                                />
                                                <Bar
                                                    dataKey="invoicedAmount"
                                                    name={t(
                                                        'crm.salesPerformanceDashboard.charts.series.invoicedAmount'
                                                    )}
                                                    fill="#8C6046"
                                                    radius={[4, 4, 0, 0]}
                                                />
                                                <Bar
                                                    dataKey="collectedAmount"
                                                    name={t(
                                                        'crm.salesPerformanceDashboard.charts.series.collectedAmount'
                                                    )}
                                                    fill="#2E6B4E"
                                                    radius={[4, 4, 0, 0]}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sales Representative Attainment Comparison */}
                        <div className="bg-white border border-[#E5E0D8] rounded-2xl shadow-2xs overflow-hidden">
                            <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-4">
                                <h2 className="text-xs font-bold text-[#0D0D0D] tracking-wide uppercase">
                                    {t(
                                        'crm.salesPerformanceDashboard.charts.repComparisonTitle'
                                    )}
                                </h2>
                                <p className="text-[11px] text-[#6E6862] mt-0.5">
                                    {t(
                                        'crm.salesPerformanceDashboard.charts.repComparisonSubtitle'
                                    )}
                                </p>
                            </div>
                            <div className="p-6" dir="ltr">
                                <div className="h-72 w-full">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <BarChart
                                            data={repChartData}
                                            margin={{
                                                top: 12,
                                                right: 20,
                                                left: 10,
                                                bottom: 12,
                                            }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                                stroke="#EFECE6"
                                            />
                                            <XAxis
                                                dataKey="name"
                                                tick={{
                                                    fill: '#6E6862',
                                                    fontSize: 11,
                                                }}
                                            />
                                            <YAxis
                                                tick={{
                                                    fill: '#6E6862',
                                                    fontSize: 11,
                                                }}
                                                tickFormatter={(v) =>
                                                    `${Math.round(Number(v) / 1000)}k`
                                                }
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#F8F6F2' }}
                                                formatter={(val: any) => [
                                                    `${Number(val).toLocaleString()} SAR`,
                                                ]}
                                                contentStyle={{
                                                    backgroundColor: '#0D0D0D',
                                                    borderColor: '#037F8C',
                                                    borderRadius: '10px',
                                                    color: '#FAF8F5',
                                                    fontSize: '12px',
                                                }}
                                            />
                                            <Legend
                                                wrapperStyle={{
                                                    fontSize: '11px',
                                                }}
                                            />
                                            <Bar
                                                dataKey="pipelineValue"
                                                name={t(
                                                    'crm.salesPerformanceDashboard.charts.series.expectedValue'
                                                )}
                                                fill="#6A7358"
                                                radius={[4, 4, 0, 0]}
                                            />
                                            <Bar
                                                dataKey="wonValue"
                                                name={t(
                                                    'crm.salesPerformanceDashboard.charts.series.wonDealValue'
                                                )}
                                                fill="#037F8C"
                                                radius={[4, 4, 0, 0]}
                                            />
                                            <Bar
                                                dataKey="collectedAmount"
                                                name={t(
                                                    'crm.salesPerformanceDashboard.charts.series.collectedAmount'
                                                )}
                                                fill="#2E6B4E"
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Row 2: Deal Stage Value Forecast & Sector Performance */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Deal Stage Value vs Weighted Forecast */}
                        <div className="bg-white border border-[#E5E0D8] rounded-2xl shadow-2xs overflow-hidden">
                            <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-4">
                                <h2 className="text-xs font-bold text-[#0D0D0D] tracking-wide uppercase">
                                    {t(
                                        'crm.salesPerformanceDashboard.charts.stageDistributionTitle'
                                    )}
                                </h2>
                                <p className="text-[11px] text-[#6E6862] mt-0.5">
                                    {t(
                                        'crm.salesPerformanceDashboard.charts.stageDistributionSubtitle'
                                    )}
                                </p>
                            </div>
                            <div className="p-6" dir="ltr">
                                <div className="h-72 w-full">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <BarChart
                                            data={stageChartData}
                                            margin={{
                                                top: 12,
                                                right: 20,
                                                left: 10,
                                                bottom: 12,
                                            }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                                stroke="#EFECE6"
                                            />
                                            <XAxis
                                                dataKey="name"
                                                tick={{
                                                    fill: '#6E6862',
                                                    fontSize: 11,
                                                }}
                                            />
                                            <YAxis
                                                tick={{
                                                    fill: '#6E6862',
                                                    fontSize: 11,
                                                }}
                                                tickFormatter={(v) =>
                                                    `${Math.round(Number(v) / 1000)}k`
                                                }
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#F8F6F2' }}
                                                formatter={(val: any) => [
                                                    `${Number(val).toLocaleString()} SAR`,
                                                ]}
                                                contentStyle={{
                                                    backgroundColor: '#0D0D0D',
                                                    borderColor: '#037F8C',
                                                    borderRadius: '10px',
                                                    color: '#FAF8F5',
                                                    fontSize: '12px',
                                                }}
                                            />
                                            <Legend
                                                wrapperStyle={{
                                                    fontSize: '11px',
                                                }}
                                            />
                                            <Bar
                                                dataKey="totalValue"
                                                name={t(
                                                    'crm.salesPerformanceDashboard.charts.series.expectedValue'
                                                )}
                                                fill="#037F8C"
                                                radius={[4, 4, 0, 0]}
                                            />
                                            <Bar
                                                dataKey="weightedValue"
                                                name={t(
                                                    'crm.salesPerformanceDashboard.charts.series.weightedValue'
                                                )}
                                                fill="#8C6046"
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Sector Performance Breakdown */}
                        <div className="bg-white border border-[#E5E0D8] rounded-2xl shadow-2xs overflow-hidden">
                            <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-4">
                                <h2 className="text-xs font-bold text-[#0D0D0D] tracking-wide uppercase">
                                    {t(
                                        'crm.salesPerformanceDashboard.charts.sectorBreakdownTitle'
                                    )}
                                </h2>
                                <p className="text-[11px] text-[#6E6862] mt-0.5">
                                    {t(
                                        'crm.salesPerformanceDashboard.charts.sectorBreakdownSubtitle'
                                    )}
                                </p>
                            </div>
                            <div className="p-6" dir="ltr">
                                <div className="h-72 w-full">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <BarChart
                                            data={sectorChartData}
                                            margin={{
                                                top: 12,
                                                right: 20,
                                                left: 10,
                                                bottom: 12,
                                            }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                                stroke="#EFECE6"
                                            />
                                            <XAxis
                                                dataKey="name"
                                                tick={{
                                                    fill: '#6E6862',
                                                    fontSize: 11,
                                                }}
                                            />
                                            <YAxis
                                                tick={{
                                                    fill: '#6E6862',
                                                    fontSize: 11,
                                                }}
                                                tickFormatter={(v) =>
                                                    `${Math.round(Number(v) / 1000)}k`
                                                }
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#F8F6F2' }}
                                                formatter={(val: any) => [
                                                    `${Number(val).toLocaleString()} SAR`,
                                                ]}
                                                contentStyle={{
                                                    backgroundColor: '#0D0D0D',
                                                    borderColor: '#037F8C',
                                                    borderRadius: '10px',
                                                    color: '#FAF8F5',
                                                    fontSize: '12px',
                                                }}
                                            />
                                            <Legend
                                                wrapperStyle={{
                                                    fontSize: '11px',
                                                }}
                                            />
                                            <Bar
                                                dataKey="pipelineValue"
                                                name={t(
                                                    'crm.salesPerformanceDashboard.charts.series.expectedValue'
                                                )}
                                                fill="#6A7358"
                                                radius={[4, 4, 0, 0]}
                                            />
                                            <Bar
                                                dataKey="wonValue"
                                                name={t(
                                                    'crm.salesPerformanceDashboard.charts.series.wonDealValue'
                                                )}
                                                fill="#037F8C"
                                                radius={[4, 4, 0, 0]}
                                            />
                                            <Bar
                                                dataKey="invoicedAmount"
                                                name={t(
                                                    'crm.salesPerformanceDashboard.charts.series.invoicedAmount'
                                                )}
                                                fill="#0891B2"
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sales Representative Performance Scorecard Table */}
                    <div className="rounded-2xl bg-white border border-[#E5E0D8] overflow-hidden shadow-xs">
                        <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <div className="flex items-center gap-2">
                                    <UserCheck
                                        size={15}
                                        className="text-[#037F8C]"
                                    />
                                    <h2 className="text-xs font-bold text-[#0D0D0D] tracking-wide uppercase">
                                        {t(
                                            'crm.salesPerformanceDashboard.tables.repScorecardTitle'
                                        )}
                                    </h2>
                                </div>
                                <p className="text-[11px] text-[#6E6862] mt-0.5">
                                    {t(
                                        'crm.salesPerformanceDashboard.tables.repScorecardSubtitle'
                                    )}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate('/crm/deals')}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#037F8C] hover:underline cursor-pointer self-start sm:self-auto"
                            >
                                {t(
                                    'crm.salesPerformanceDashboard.quickLinks.viewDeals'
                                )}
                                <ArrowUpRight size={13} />
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-start border-collapse">
                                <thead>
                                    <tr className="bg-[#FAF8F5]/60 border-b border-[#E5E0D8] text-[11px] font-bold text-[#6E6862] uppercase">
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.salesPerformanceDashboard.tables.columns.rep'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.salesPerformanceDashboard.tables.columns.leadsAndConversion'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.salesPerformanceDashboard.tables.columns.dealsAndWinRate'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.salesPerformanceDashboard.tables.columns.pipelineAndWeighted'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.salesPerformanceDashboard.tables.columns.wonValue'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.salesPerformanceDashboard.tables.columns.quotesAndContracts'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.salesPerformanceDashboard.tables.columns.invoicedAndCollected'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.salesPerformanceDashboard.tables.columns.collectionRate'
                                            )}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E5E0D8] text-xs">
                                    {dashboard.repPerformance.map((rep) => (
                                        <tr
                                            key={rep.employeeId}
                                            className="hover:bg-[#FAF8F5]/60 transition-colors"
                                        >
                                            <td className="py-3.5 px-4">
                                                <div className="font-semibold text-[#0D0D0D]">
                                                    {isRtl
                                                        ? rep.nameAr
                                                        : rep.nameEn}
                                                </div>
                                                <div className="text-[11px] text-[#6E6862] flex items-center gap-1.5 mt-0.5">
                                                    <span
                                                        className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#FAF8F5] border border-[#E5E0D8] text-[#037F8C]"
                                                        dir="ltr"
                                                    >
                                                        {rep.employeeCode}
                                                    </span>
                                                    <span>
                                                        {isRtl
                                                            ? rep.roleAr
                                                            : rep.roleEn}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div
                                                    className="font-mono font-semibold text-[#0D0D0D]"
                                                    dir="ltr"
                                                >
                                                    {rep.convertedLeadsCount} /{' '}
                                                    {rep.leadsCount}
                                                </div>
                                                <div
                                                    className="text-[11px] font-mono text-[#6E6862]"
                                                    dir="ltr"
                                                >
                                                    {rep.leadConversionRate}%
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div
                                                    className="font-mono font-semibold text-[#0D0D0D]"
                                                    dir="ltr"
                                                >
                                                    {rep.wonDealsCount}W •{' '}
                                                    {rep.openDealsCount}O •{' '}
                                                    {rep.dealsCount}T
                                                </div>
                                                <div
                                                    className="text-[11px] font-mono text-[#2E6B4E] font-semibold"
                                                    dir="ltr"
                                                >
                                                    {rep.winRate}% win
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div
                                                    className="font-mono font-semibold text-[#0D0D0D]"
                                                    dir="ltr"
                                                >
                                                    {rep.pipelineValue.toLocaleString()}{' '}
                                                    SAR
                                                </div>
                                                <div
                                                    className="text-[11px] font-mono text-[#6E6862]"
                                                    dir="ltr"
                                                >
                                                    {rep.weightedPipelineValue.toLocaleString()}{' '}
                                                    SAR
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <span
                                                    className="font-mono font-bold text-[#2E6B4E]"
                                                    dir="ltr"
                                                >
                                                    {rep.wonValue.toLocaleString()}{' '}
                                                    SAR
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div
                                                    className="font-mono text-[#0D0D0D]"
                                                    dir="ltr"
                                                >
                                                    Q ({rep.quotationsCount}):{' '}
                                                    {rep.quotedValue.toLocaleString()}
                                                </div>
                                                <div
                                                    className="text-[11px] font-mono text-[#0891B2]"
                                                    dir="ltr"
                                                >
                                                    C ({rep.contractsCount}):{' '}
                                                    {rep.contractedValue.toLocaleString()}
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div
                                                    className="font-mono font-semibold text-[#0D0D0D]"
                                                    dir="ltr"
                                                >
                                                    {rep.invoicedAmount.toLocaleString()}{' '}
                                                    SAR
                                                </div>
                                                <div
                                                    className="text-[11px] font-mono text-[#2E6B4E]"
                                                    dir="ltr"
                                                >
                                                    {rep.collectedAmount.toLocaleString()}{' '}
                                                    SAR
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4 min-w-[140px]">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <span
                                                        className="font-mono font-bold text-xs text-[#037F8C]"
                                                        dir="ltr"
                                                    >
                                                        {rep.collectionRate}%
                                                    </span>
                                                    {rep.outstandingAmount >
                                                        0 && (
                                                        <span
                                                            className="font-mono text-[10px] text-[#B45309]"
                                                            dir="ltr"
                                                        >
                                                            {rep.outstandingAmount.toLocaleString()}{' '}
                                                            due
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="w-full h-1.5 rounded-full bg-[#EFECE6] overflow-hidden">
                                                    <div
                                                        className="h-full bg-[#2E6B4E] rounded-full transition-all"
                                                        style={{
                                                            width: `${Math.min(100, rep.collectionRate)}%`,
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Client Company Commercial Performance Breakdown */}
                    <div className="rounded-2xl bg-white border border-[#E5E0D8] overflow-hidden shadow-xs">
                        <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Building2
                                        size={15}
                                        className="text-[#037F8C]"
                                    />
                                    <h2 className="text-xs font-bold text-[#0D0D0D] tracking-wide uppercase">
                                        {t(
                                            'crm.salesPerformanceDashboard.tables.companyScorecardTitle'
                                        )}
                                    </h2>
                                </div>
                                <p className="text-[11px] text-[#6E6862] mt-0.5">
                                    {t(
                                        'crm.salesPerformanceDashboard.tables.companyScorecardSubtitle'
                                    )}
                                </p>
                            </div>
                            <div className="flex items-center gap-3 self-start sm:self-auto">
                                <button
                                    type="button"
                                    onClick={() => navigate('/crm/quotations')}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer"
                                >
                                    {t(
                                        'crm.salesPerformanceDashboard.quickLinks.viewQuotations'
                                    )}
                                    <ArrowUpRight size={13} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/crm/invoices')}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#037F8C] hover:underline cursor-pointer"
                                >
                                    {t(
                                        'crm.salesPerformanceDashboard.quickLinks.viewInvoices'
                                    )}
                                    <ArrowUpRight size={13} />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-start border-collapse">
                                <thead>
                                    <tr className="bg-[#FAF8F5]/60 border-b border-[#E5E0D8] text-[11px] font-bold text-[#6E6862] uppercase">
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.salesPerformanceDashboard.tables.columns.company'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.salesPerformanceDashboard.tables.columns.sector'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.salesPerformanceDashboard.tables.columns.onboardingStatus'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.salesPerformanceDashboard.tables.columns.dealsSummary'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.salesPerformanceDashboard.tables.columns.wonValue'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.salesPerformanceDashboard.tables.columns.contractedValue'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.salesPerformanceDashboard.tables.columns.invoicedAndCollected'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.salesPerformanceDashboard.tables.columns.outstanding'
                                            )}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E5E0D8] text-xs">
                                    {dashboard.companyPerformance.map(
                                        (comp) => (
                                            <tr
                                                key={comp.companyId}
                                                className="hover:bg-[#FAF8F5]/60 transition-colors"
                                            >
                                                <td className="py-3.5 px-4">
                                                    <div className="font-semibold text-[#0D0D0D]">
                                                        {isRtl
                                                            ? comp.companyNameAr
                                                            : comp.companyNameEn}
                                                    </div>
                                                    <div className="text-[11px] text-[#6E6862] flex items-center gap-1.5 mt-0.5">
                                                        <span
                                                            className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#FAF8F5] border border-[#E5E0D8] text-[#037F8C]"
                                                            dir="ltr"
                                                        >
                                                            {comp.companyCode}
                                                        </span>
                                                        {(comp.assignedEmployeeNameEn ||
                                                            comp.assignedEmployeeNameAr) && (
                                                            <span>
                                                                {isRtl
                                                                    ? comp.assignedEmployeeNameAr ||
                                                                      comp.assignedEmployeeNameEn
                                                                    : comp.assignedEmployeeNameEn}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="py-3.5 px-4 text-[#6E6862]">
                                                    <span className="inline-flex items-center gap-1">
                                                        <Layers
                                                            size={12}
                                                            className="text-[#857E74]"
                                                        />
                                                        {isRtl
                                                            ? comp.sectorNameAr ||
                                                              comp.sectorNameEn ||
                                                              '—'
                                                            : comp.sectorNameEn ||
                                                              '—'}
                                                    </span>
                                                </td>

                                                <td className="py-3.5 px-4">
                                                    <span className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] text-[11px] font-semibold text-[#037F8C]">
                                                        {translateOnboardingStatus(
                                                            comp.onboardingStatus
                                                        )}
                                                    </span>
                                                </td>

                                                <td className="py-3.5 px-4">
                                                    <div
                                                        className="font-mono font-semibold text-[#0D0D0D]"
                                                        dir="ltr"
                                                    >
                                                        {comp.wonDealsCount} /{' '}
                                                        {comp.dealsCount}
                                                    </div>
                                                    <div
                                                        className="text-[11px] font-mono text-[#6E6862]"
                                                        dir="ltr"
                                                    >
                                                        {comp.pipelineValue.toLocaleString()}{' '}
                                                        SAR
                                                    </div>
                                                </td>

                                                <td className="py-3.5 px-4">
                                                    <span
                                                        className="font-mono font-bold text-[#2E6B4E]"
                                                        dir="ltr"
                                                    >
                                                        {comp.wonValue.toLocaleString()}{' '}
                                                        SAR
                                                    </span>
                                                </td>

                                                <td className="py-3.5 px-4">
                                                    <span
                                                        className="font-mono font-semibold text-[#0891B2]"
                                                        dir="ltr"
                                                    >
                                                        {comp.contractedValue.toLocaleString()}{' '}
                                                        SAR
                                                    </span>
                                                </td>

                                                <td className="py-3.5 px-4">
                                                    <div
                                                        className="font-mono font-semibold text-[#0D0D0D]"
                                                        dir="ltr"
                                                    >
                                                        {comp.invoicedAmount.toLocaleString()}{' '}
                                                        SAR
                                                    </div>
                                                    <div
                                                        className="text-[11px] font-mono text-[#2E6B4E]"
                                                        dir="ltr"
                                                    >
                                                        {comp.collectedAmount.toLocaleString()}{' '}
                                                        SAR (
                                                        {comp.collectionRate}%)
                                                    </div>
                                                </td>

                                                <td className="py-3.5 px-4">
                                                    <span
                                                        className={`font-mono font-semibold ${
                                                            comp.outstandingAmount >
                                                            0
                                                                ? 'text-[#B45309]'
                                                                : 'text-[#2E6B4E]'
                                                        }`}
                                                        dir="ltr"
                                                    >
                                                        {comp.outstandingAmount.toLocaleString()}{' '}
                                                        SAR
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
