import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
    Award,
    FileText,
    FileCheck2,
    Receipt,
    Building2,
} from 'lucide-react';
import type { CrmWonDealSummary } from '../../../api/api';

export interface WonDealSummaryDrawerProps {
    isOpen: boolean;
    summary: CrmWonDealSummary | null;
    onClose: () => void;
    onNavigateToQuotations?: (dealId: string) => void;
    onNavigateToContracts?: (dealId: string) => void;
    onNavigateToInvoices?: (dealId: string) => void;
}

export const WonDealSummaryDrawer: React.FC<WonDealSummaryDrawerProps> = ({
    isOpen,
    summary,
    onClose,
    onNavigateToQuotations,
    onNavigateToContracts,
    onNavigateToInvoices,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    if (!isOpen || !summary) return null;

    const { deal, quotations, contracts, invoices } = summary;
    const collectionPct =
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
        <div
            className="fixed inset-0 z-50 flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="won-deal-summary-drawer-title"
        >
            <div
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-2xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col overflow-hidden text-start">
                {/* Header */}
                <div className="px-6 py-5 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span
                                className="px-2.5 py-0.5 rounded-md bg-white border border-[#E5E0D8] text-xs font-mono font-semibold text-[#2D3F2C]"
                                dir="ltr"
                            >
                                {deal.code}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#E9F5EE] text-[#2E6B4E] text-xs font-semibold">
                                <Award size={12} />
                                {t('crm.commercial.deals.stages.won')}
                                {deal.wonAt ? ` • ${deal.wonAt}` : ''}
                            </span>
                        </div>
                        <h2
                            id="won-deal-summary-drawer-title"
                            className="text-lg font-bold text-[#0D0D0D] truncate pt-0.5"
                        >
                            {isRtl
                                ? deal.titleAr || deal.titleEn
                                : deal.titleEn}
                        </h2>
                        <p className="text-xs text-[#6E6862]">
                            {t('crm.commercial.wonDeals.drawer.subtitle')}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('crm.commercial.common.close')}
                        className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Financial & Revenue Collection Progress */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#2D3F2C]">
                                {t(
                                    'crm.commercial.wonDeals.drawer.collectionRate'
                                )}
                            </span>
                            <span
                                className="font-mono font-bold text-[#2E6B4E]"
                                dir="ltr"
                            >
                                {collectionPct}%
                            </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-white border border-[#E5E0D8] overflow-hidden">
                            <div
                                className="h-full bg-[#2E6B4E] transition-all"
                                style={{ width: `${collectionPct}%` }}
                            />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
                            <div className="p-2.5 rounded-lg bg-white border border-[#E5E0D8]">
                                <span className="text-[10px] text-[#6E6862] block">
                                    {t(
                                        'crm.commercial.wonDeals.drawer.awardedValue'
                                    )}
                                </span>
                                <span
                                    className="font-mono font-bold text-[#0D0D0D]"
                                    dir="ltr"
                                >
                                    {deal.expectedValue.toLocaleString()} SAR
                                </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-white border border-[#E5E0D8]">
                                <span className="text-[10px] text-[#6E6862] block">
                                    {t(
                                        'crm.commercial.wonDeals.drawer.contractedValue'
                                    )}
                                </span>
                                <span
                                    className="font-mono font-bold text-[#2D3F2C]"
                                    dir="ltr"
                                >
                                    {summary.totalContractedValue.toLocaleString()}{' '}
                                    SAR
                                </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-white border border-[#E5E0D8]">
                                <span className="text-[10px] text-[#6E6862] block">
                                    {t(
                                        'crm.commercial.wonDeals.drawer.collectedValue'
                                    )}
                                </span>
                                <span
                                    className="font-mono font-bold text-[#2E6B4E]"
                                    dir="ltr"
                                >
                                    {summary.totalCollectedValue.toLocaleString()}{' '}
                                    SAR
                                </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-white border border-[#E5E0D8]">
                                <span className="text-[10px] text-[#6E6862] block">
                                    {t(
                                        'crm.commercial.wonDeals.drawer.outstandingValue'
                                    )}
                                </span>
                                <span
                                    className="font-mono font-bold text-[#B45309]"
                                    dir="ltr"
                                >
                                    {summary.totalOutstandingValue.toLocaleString()}{' '}
                                    SAR
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Customer & Account Executive */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-white p-4 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#0D0D0D]">
                            <Building2 size={14} className="text-[#2D3F2C]" />
                            <span>
                                {t(
                                    'crm.commercial.wonDeals.columns.companyAndSector'
                                )}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t('crm.commercial.deals.form.companyLabel')}
                                </span>
                                <span className="font-semibold text-[#0D0D0D]">
                                    {isRtl
                                        ? deal.companyNameAr ||
                                          deal.companyNameEn
                                        : deal.companyNameEn}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t(
                                        'crm.commercial.deals.form.assignedRepLabel'
                                    )}
                                </span>
                                <span className="font-semibold text-[#0D0D0D]">
                                    {isRtl
                                        ? deal.assignedEmployeeNameAr ||
                                          deal.assignedEmployeeNameEn
                                        : deal.assignedEmployeeNameEn}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Linked Quotations */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-white p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#0D0D0D]">
                                <FileText size={14} className="text-[#2D3F2C]" />
                                <span>
                                    {t(
                                        'crm.commercial.deals.viewDrawer.linkedQuotations',
                                        { count: quotations.length }
                                    )}
                                </span>
                            </div>
                            {onNavigateToQuotations && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        onNavigateToQuotations(deal.id)
                                    }
                                    className="text-[11px] font-semibold text-[#2D3F2C] hover:underline cursor-pointer"
                                >
                                    {t(
                                        'crm.commercial.wonDeals.drawer.createQuotation'
                                    )}
                                </button>
                            )}
                        </div>
                        {quotations.map((q) => (
                            <div
                                key={q.id}
                                className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between text-xs"
                            >
                                <div>
                                    <span
                                        className="font-mono font-bold text-[#2D3F2C]"
                                        dir="ltr"
                                    >
                                        {q.code}
                                    </span>{' '}
                                    <span>
                                        {isRtl
                                            ? q.titleAr || q.titleEn
                                            : q.titleEn}
                                    </span>
                                </div>
                                <span
                                    className="font-mono font-bold text-[#0D0D0D]"
                                    dir="ltr"
                                >
                                    {q.grandTotal.toLocaleString()} SAR
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Linked Contracts */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-white p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#0D0D0D]">
                                <FileCheck2
                                    size={14}
                                    className="text-[#2D3F2C]"
                                />
                                <span>
                                    {t(
                                        'crm.commercial.deals.viewDrawer.linkedContracts',
                                        { count: contracts.length }
                                    )}
                                </span>
                            </div>
                            {onNavigateToContracts && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        onNavigateToContracts(deal.id)
                                    }
                                    className="text-[11px] font-semibold text-[#2D3F2C] hover:underline cursor-pointer"
                                >
                                    {t(
                                        'crm.commercial.wonDeals.drawer.createContract'
                                    )}
                                </button>
                            )}
                        </div>
                        {contracts.map((c) => (
                            <div
                                key={c.id}
                                className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between text-xs"
                            >
                                <div>
                                    <span
                                        className="font-mono font-bold text-[#2D3F2C]"
                                        dir="ltr"
                                    >
                                        {c.contractNumber}
                                    </span>{' '}
                                    <span>
                                        {isRtl
                                            ? c.titleAr || c.titleEn
                                            : c.titleEn}
                                    </span>
                                </div>
                                <span
                                    className="font-mono font-bold text-[#0D0D0D]"
                                    dir="ltr"
                                >
                                    {c.totalValue.toLocaleString()} SAR
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Linked Invoices */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-white p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#0D0D0D]">
                                <Receipt size={14} className="text-[#2D3F2C]" />
                                <span>
                                    {t(
                                        'crm.commercial.deals.viewDrawer.linkedInvoices',
                                        { count: invoices.length }
                                    )}
                                </span>
                            </div>
                            {onNavigateToInvoices && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        onNavigateToInvoices(deal.id)
                                    }
                                    className="text-[11px] font-semibold text-[#2D3F2C] hover:underline cursor-pointer"
                                >
                                    {t(
                                        'crm.commercial.wonDeals.drawer.createInvoice'
                                    )}
                                </button>
                            )}
                        </div>
                        {invoices.map((inv) => (
                            <div
                                key={inv.id}
                                className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between text-xs"
                            >
                                <div>
                                    <span
                                        className="font-mono font-bold text-[#2D3F2C]"
                                        dir="ltr"
                                    >
                                        {inv.invoiceNumber}
                                    </span>{' '}
                                    <span>
                                        {isRtl
                                            ? inv.titleAr || inv.titleEn
                                            : inv.titleEn}
                                    </span>
                                </div>
                                <span
                                    className="font-mono font-bold text-[#2E6B4E]"
                                    dir="ltr"
                                >
                                    {inv.paidAmount.toLocaleString()} /{' '}
                                    {inv.totalAmount.toLocaleString()} SAR
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] cursor-pointer"
                    >
                        {t('crm.commercial.common.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};
