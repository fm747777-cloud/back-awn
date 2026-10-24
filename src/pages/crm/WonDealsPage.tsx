import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Award,
    Search,
    X,
    RotateCcw,
    Download,
    Eye,
    FileText,
    FileCheck2,
    Receipt,
    TrendingUp,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import {
    crmApi,
    CRM_SALES_EMPLOYEES,
    type CrmWonDealSummary,
} from '../../api/api';
import { WonDealSummaryDrawer } from '../../components/crm/won-deals/WonDealSummaryDrawer';

export const WonDealsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    const [search, setSearch] = useState('');
    const [companyFilter, setCompanyFilter] = useState<string>('all');
    const [sectorFilter, setSectorFilter] = useState<string>('all');
    const [employeeFilter, setEmployeeFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const limit = 10;

    const [viewingSummary, setViewingSummary] =
        useState<CrmWonDealSummary | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const { data: wonSummariesRes, isLoading } = useQuery({
        queryKey: [
            'crm',
            'won-deals',
            'summaries',
            {
                search,
                companyId: companyFilter,
                sectorId: sectorFilter,
                assignedEmployeeId: employeeFilter,
                page,
                limit,
            },
        ],
        queryFn: () =>
            crmApi.wonDeals.getSummaries({
                search,
                companyId: companyFilter,
                sectorId: sectorFilter,
                assignedEmployeeId: employeeFilter,
                page,
                limit,
            }),
    });

    const { data: companiesRes } = useQuery({
        queryKey: ['crm', 'companies', 'lookup'],
        queryFn: () => crmApi.companies.getAll({ limit: 200 }),
    });

    const { data: sectorsRes } = useQuery({
        queryKey: ['crm', 'sectors', 'lookup'],
        queryFn: () => crmApi.getSectors({ limit: 200 }),
    });

    const { data: employees = CRM_SALES_EMPLOYEES } = useQuery({
        queryKey: ['crm', 'employees'],
        queryFn: () => crmApi.getSalesEmployees(),
    });

    const summaries = wonSummariesRes?.data || [];
    const totalRecords = wonSummariesRes?.total || 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));

    const companies = companiesRes?.data || [];
    const sectors = sectorsRes?.data || [];

    // Aggregate executive KPIs across Won Deals
    const totalWonCount = totalRecords;
    const totalWonValue = summaries.reduce(
        (sum, s) => sum + s.deal.expectedValue,
        0
    );
    const totalContractedValue = summaries.reduce(
        (sum, s) => sum + s.totalContractedValue,
        0
    );
    const totalContractsCount = summaries.reduce(
        (sum, s) => sum + s.contracts.length,
        0
    );
    const totalBilledValue = summaries.reduce(
        (sum, s) => sum + s.totalInvoicedValue,
        0
    );
    const totalCollectedValue = summaries.reduce(
        (sum, s) => sum + s.totalCollectedValue,
        0
    );
    const collectionRate =
        totalBilledValue > 0
            ? Math.round((totalCollectedValue / totalBilledValue) * 100)
            : 0;

    const handleExportCsv = () => {
        const headers = [
            'Deal Code',
            'Won Deal Title',
            'Company',
            'Won Date',
            'Awarded Value (SAR)',
            'Quotations Count',
            'Contracts Count',
            'Contracted Value (SAR)',
            'Invoiced Value (SAR)',
            'Collected Value (SAR)',
        ];
        const rows = summaries.map((s) => [
            s.deal.code,
            `"${s.deal.titleEn.replace(/"/g, '""')}"`,
            `"${(s.deal.companyNameEn || '').replace(/"/g, '""')}"`,
            s.deal.wonAt || s.deal.expectedCloseDate,
            String(s.deal.expectedValue),
            String(s.quotations.length),
            String(s.contracts.length),
            String(s.totalContractedValue),
            String(s.totalInvoicedValue),
            String(s.totalCollectedValue),
        ]);
        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join(
            '\n'
        );
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `awn-crm-won-deals-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        setToastMessage(
            t('crm.commercial.common.exportedCsv', { count: summaries.length })
        );
        window.setTimeout(() => setToastMessage(null), 3500);
    };

    const handleResetFilters = () => {
        setSearch('');
        setCompanyFilter('all');
        setSectorFilter('all');
        setEmployeeFilter('all');
        setPage(1);
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6 text-start">
            {toastMessage && (
                <div className="fixed bottom-5 end-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border bg-[#E9F5EE] border-[#2E6B4E]/30 text-[#2E6B4E] text-xs font-semibold">
                    <CheckCircle2 size={16} />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white rounded-2xl border border-[#E5E0D8] p-6 shadow-xs">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span
                            className="px-2.5 py-0.5 rounded-md bg-[#2E6B4E]/10 border border-[#2E6B4E]/20 text-xs font-mono font-bold text-[#2E6B4E]"
                            dir="ltr"
                        >
                            {t('crm.commercial.wonDeals.badge')}
                        </span>
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.groups.deals')}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#0D0D0D]">
                        {t('crm.pages.wonDeals.title')}
                    </h1>
                    <p className="text-xs text-[#6E6862]">
                        {t('crm.pages.wonDeals.subtitle')}
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                    >
                        <Download size={14} />
                        {t('crm.commercial.common.exportCsv')}
                    </button>
                </div>
            </div>

            {/* 4 Executive KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.commercial.wonDeals.kpis.totalWonCount')}
                        </span>
                        <div className="text-2xl font-bold text-[#0D0D0D] font-mono">
                            {totalWonCount}
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t('crm.commercial.wonDeals.kpis.totalWonCountSub')}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#E9F5EE] text-[#2E6B4E] flex items-center justify-center">
                        <Award size={19} />
                    </div>
                </div>

                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.commercial.wonDeals.kpis.totalWonValue')}
                        </span>
                        <div
                            className="text-2xl font-bold text-[#037F8C] font-mono"
                            dir="ltr"
                        >
                            {totalWonValue.toLocaleString()} SAR
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t('crm.commercial.wonDeals.kpis.totalWonValueSub')}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#037F8C]/10 text-[#037F8C] flex items-center justify-center">
                        <TrendingUp size={19} />
                    </div>
                </div>

                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t(
                                'crm.commercial.wonDeals.kpis.totalContractedValue'
                            )}
                        </span>
                        <div
                            className="text-2xl font-bold text-[#0891B2] font-mono"
                            dir="ltr"
                        >
                            {totalContractedValue.toLocaleString()} SAR
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t(
                                'crm.commercial.wonDeals.kpis.totalContractedValueSub',
                                { count: totalContractsCount }
                            )}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 text-[#0891B2] flex items-center justify-center">
                        <FileCheck2 size={19} />
                    </div>
                </div>

                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t(
                                'crm.commercial.wonDeals.kpis.collectionProgress'
                            )}
                        </span>
                        <div
                            className="text-2xl font-bold text-[#2E6B4E] font-mono"
                            dir="ltr"
                        >
                            {totalCollectedValue.toLocaleString()} SAR
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t(
                                'crm.commercial.wonDeals.kpis.collectionProgressSub',
                                {
                                    billed: totalBilledValue.toLocaleString(),
                                    rate: collectionRate,
                                }
                            )}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#E9F5EE] text-[#2E6B4E] flex items-center justify-center">
                        <Receipt size={19} />
                    </div>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="rounded-2xl bg-white border border-[#E5E0D8] p-4 space-y-3 shadow-xs">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                    <div className="relative flex-1">
                        <Search
                            size={15}
                            className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[#6E6862]"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            placeholder={t(
                                'crm.commercial.wonDeals.searchPlaceholder'
                            )}
                            className="w-full ps-9 pe-8 py-2.5 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch('');
                                    setPage(1);
                                }}
                                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleResetFilters}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer"
                    >
                        <RotateCcw size={13} />
                        {t('crm.commercial.common.resetFilters')}
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <select
                        value={companyFilter}
                        onChange={(e) => {
                            setCompanyFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D]"
                    >
                        <option value="all">
                            {t('crm.commercial.common.allCompanies')}
                        </option>
                        {companies.map((c) => (
                            <option key={c.id} value={c.id}>
                                {isRtl ? c.nameAr : c.nameEn}
                            </option>
                        ))}
                    </select>

                    <select
                        value={sectorFilter}
                        onChange={(e) => {
                            setSectorFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D]"
                    >
                        <option value="all">
                            {t('crm.commercial.common.allSectors')}
                        </option>
                        {sectors.map((s) => (
                            <option key={s.id} value={s.id}>
                                {isRtl ? s.nameAr : s.nameEn}
                            </option>
                        ))}
                    </select>

                    <select
                        value={employeeFilter}
                        onChange={(e) => {
                            setEmployeeFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D]"
                    >
                        <option value="all">
                            {t('crm.commercial.common.allEmployees')}
                        </option>
                        {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                                {isRtl ? emp.nameAr : emp.nameEn}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl bg-white border border-[#E5E0D8] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse">
                        <thead>
                            <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[11px] font-bold text-[#6E6862] uppercase">
                                <th className="py-3.5 px-4 text-start">
                                    {t('crm.commercial.wonDeals.columns.code')}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t(
                                        'crm.commercial.wonDeals.columns.dealAndWonDate'
                                    )}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t(
                                        'crm.commercial.wonDeals.columns.companyAndSector'
                                    )}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t(
                                        'crm.commercial.wonDeals.columns.wonValue'
                                    )}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t(
                                        'crm.commercial.wonDeals.columns.commercialChain'
                                    )}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t(
                                        'crm.commercial.wonDeals.columns.billingAndCollection'
                                    )}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t(
                                        'crm.commercial.wonDeals.columns.assignedRep'
                                    )}
                                </th>
                                <th className="py-3.5 px-4 text-end">
                                    {t(
                                        'crm.commercial.wonDeals.columns.actions'
                                    )}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E0D8] text-xs">
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="py-12 text-center text-[#6E6862]"
                                    >
                                        Loading won deals...
                                    </td>
                                </tr>
                            ) : summaries.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="py-12 text-center"
                                    >
                                        <div className="max-w-sm mx-auto space-y-1">
                                            <div className="text-sm font-bold text-[#0D0D0D]">
                                                {t(
                                                    'crm.commercial.wonDeals.empty.title'
                                                )}
                                            </div>
                                            <p className="text-xs text-[#6E6862]">
                                                {t(
                                                    'crm.commercial.wonDeals.empty.description'
                                                )}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                summaries.map((summary) => {
                                    const { deal } = summary;
                                    const rowPct =
                                        summary.totalInvoicedValue > 0
                                            ? Math.min(
                                                  100,
                                                  Math.round(
                                                      (summary.totalCollectedValue /
                                                          summary.totalInvoicedValue) *
                                                          100
                                                  )
                                              )
                                            : 0;
                                    return (
                                        <tr
                                            key={deal.id}
                                            className="hover:bg-[#FAF8F5]/60 transition-colors"
                                        >
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className="px-2 py-1 rounded-md bg-[#E9F5EE] border border-[#2E6B4E]/20 font-mono font-bold text-[#2E6B4E]"
                                                    dir="ltr"
                                                >
                                                    {deal.code}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-[#0D0D0D]">
                                                    {isRtl
                                                        ? deal.titleAr ||
                                                          deal.titleEn
                                                        : deal.titleEn}
                                                </div>
                                                <div
                                                    className="text-[11px] font-mono text-[#6E6862]"
                                                    dir="ltr"
                                                >
                                                    Won:{' '}
                                                    {deal.wonAt ||
                                                        deal.expectedCloseDate}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="font-semibold text-[#0D0D0D]">
                                                    {isRtl
                                                        ? deal.companyNameAr ||
                                                          deal.companyNameEn
                                                        : deal.companyNameEn}
                                                </div>
                                                <div className="text-[11px] text-[#6E6862]">
                                                    {isRtl
                                                        ? deal.sectorNameAr ||
                                                          deal.sectorNameEn
                                                        : deal.sectorNameEn}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className="font-mono font-bold text-[#037F8C]"
                                                    dir="ltr"
                                                >
                                                    {deal.expectedValue.toLocaleString()}{' '}
                                                    SAR
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] font-mono text-[11px]">
                                                        <FileText size={11} />
                                                        {
                                                            summary.quotations
                                                                .length
                                                        }
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] font-mono text-[11px]">
                                                        <FileCheck2 size={11} />
                                                        {
                                                            summary.contracts
                                                                .length
                                                        }
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] font-mono text-[11px]">
                                                        <Receipt size={11} />
                                                        {
                                                            summary.invoices
                                                                .length
                                                        }
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div
                                                    className="font-mono font-bold text-[#2E6B4E]"
                                                    dir="ltr"
                                                >
                                                    {summary.totalCollectedValue.toLocaleString()}{' '}
                                                    /{' '}
                                                    {summary.totalInvoicedValue.toLocaleString()}{' '}
                                                    SAR
                                                </div>
                                                <div className="w-28 h-1.5 rounded-full bg-[#FAF8F5] border border-[#E5E0D8] overflow-hidden mt-1">
                                                    <div
                                                        className="h-full bg-[#2E6B4E]"
                                                        style={{
                                                            width: `${rowPct}%`,
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className="font-medium text-[#0D0D0D]">
                                                    {isRtl
                                                        ? deal.assignedEmployeeNameAr ||
                                                          deal.assignedEmployeeNameEn
                                                        : deal.assignedEmployeeNameEn}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-end">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setViewingSummary(
                                                            summary
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#037F8C] cursor-pointer"
                                                >
                                                    <Eye size={13} />
                                                    {t(
                                                        'crm.commercial.common.viewDetails'
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-5 py-3.5 border-t border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between text-xs text-[#6E6862]">
                    <span>
                        {t('crm.commercial.common.showing', {
                            from:
                                totalRecords === 0
                                    ? 0
                                    : (page - 1) * limit + 1,
                            to: Math.min(page * limit, totalRecords),
                            total: totalRecords,
                        })}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="p-1.5 rounded-lg border border-[#E5E0D8] bg-white disabled:opacity-40 cursor-pointer"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <span
                            className="px-2.5 font-mono font-bold text-[#0D0D0D]"
                            dir="ltr"
                        >
                            {page} / {totalPages}
                        </span>
                        <button
                            type="button"
                            disabled={page >= totalPages}
                            onClick={() =>
                                setPage((p) => Math.min(totalPages, p + 1))
                            }
                            className="p-1.5 rounded-lg border border-[#E5E0D8] bg-white disabled:opacity-40 cursor-pointer"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* 360° Won Deal Summary Drawer */}
            <WonDealSummaryDrawer
                isOpen={Boolean(viewingSummary)}
                summary={viewingSummary}
                onClose={() => setViewingSummary(null)}
                onNavigateToQuotations={(dealId) => {
                    setViewingSummary(null);
                    navigate(`/crm/quotations?dealId=${dealId}`);
                }}
                onNavigateToContracts={(dealId) => {
                    setViewingSummary(null);
                    navigate(`/crm/contracts?dealId=${dealId}`);
                }}
                onNavigateToInvoices={(dealId) => {
                    setViewingSummary(null);
                    navigate(`/crm/invoices?dealId=${dealId}`);
                }}
            />
        </div>
    );
};

export default WonDealsPage;
