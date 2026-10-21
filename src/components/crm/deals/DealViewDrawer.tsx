import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
    Edit3,
    Building2,
    FileText,
    FileCheck2,
    Receipt,
    PlusCircle,
    TrendingUp,
} from 'lucide-react';
import {
    CRM_DEAL_STAGE_VALUES,
    CRM_DEAL_STAGE_DEFAULT_PROBABILITY,
    type CrmDealRecord,
    type CrmDealStage,
    type CrmQuotationRecord,
    type CrmContractRecord,
    type CrmInvoiceRecord,
} from '../../../schemas/crmSchema';

export interface DealViewDrawerProps {
    isOpen: boolean;
    record: CrmDealRecord | null;
    quotations: CrmQuotationRecord[];
    contracts: CrmContractRecord[];
    invoices: CrmInvoiceRecord[];
    onClose: () => void;
    onEdit: (record: CrmDealRecord) => void;
    onTransitionStage: (id: string, stage: CrmDealStage) => void;
    onCreateQuotationForDeal?: (deal: CrmDealRecord) => void;
}

export const DealViewDrawer: React.FC<DealViewDrawerProps> = ({
    isOpen,
    record,
    quotations,
    contracts,
    invoices,
    onClose,
    onEdit,
    onTransitionStage,
    onCreateQuotationForDeal,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    if (!isOpen || !record) return null;

    const dealQuotations = quotations.filter((q) => q.dealId === record.id);
    const dealContracts = contracts.filter((c) => c.dealId === record.id);
    const dealInvoices = invoices.filter((inv) => inv.dealId === record.id);

    const weightedValue = Math.round(
        (record.expectedValue * record.probability) / 100
    );

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="deal-view-drawer-title"
        >
            <div
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col overflow-hidden text-start">
                {/* Header */}
                <div className="px-6 py-5 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span
                                className="px-2.5 py-0.5 rounded-md bg-white border border-[#E5E0D8] text-xs font-mono font-semibold text-[#037F8C]"
                                dir="ltr"
                            >
                                {record.code}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md bg-[#037F8C]/10 text-[#037F8C] text-xs font-semibold">
                                {t(`crm.commercial.deals.stages.${record.stage}`)} (
                                {record.probability}%)
                            </span>
                        </div>
                        <h2
                            id="deal-view-drawer-title"
                            className="text-lg font-bold text-[#0D0D0D] truncate pt-0.5"
                        >
                            {isRtl
                                ? record.titleAr || record.titleEn
                                : record.titleEn}
                        </h2>
                        <p className="text-xs text-[#6E6862]">
                            {t('crm.commercial.deals.viewDrawer.subtitle')}
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
                    {/* Quick Stage Switcher & Quotation CTA */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="text-xs font-bold text-[#037F8C] flex items-center gap-1.5">
                                <TrendingUp size={14} />
                                {t('crm.commercial.deals.viewDrawer.quickStageTitle')}
                            </h3>
                            {onCreateQuotationForDeal && (
                                <button
                                    type="button"
                                    onClick={() => onCreateQuotationForDeal(record)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#037F8C] hover:bg-[#233122] text-white text-[11px] font-semibold cursor-pointer"
                                >
                                    <PlusCircle size={12} />
                                    {t(
                                        'crm.commercial.deals.viewDrawer.createQuotationCta'
                                    )}
                                </button>
                            )}
                        </div>
                        <select
                            value={record.stage}
                            onChange={(e) =>
                                onTransitionStage(
                                    record.id,
                                    e.target.value as CrmDealStage
                                )
                            }
                            className="w-full px-3 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#0D0D0D]"
                        >
                            {CRM_DEAL_STAGE_VALUES.map((st) => (
                                <option key={st} value={st}>
                                    {t(`crm.commercial.deals.stages.${st}`)} (
                                    {CRM_DEAL_STAGE_DEFAULT_PROBABILITY[st]}%)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Valuation & Customer Summary */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-white p-4 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#0D0D0D]">
                            <Building2 size={14} className="text-[#037F8C]" />
                            <span>{t('crm.commercial.deals.viewDrawer.title')}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t('crm.commercial.deals.form.companyLabel')}
                                </span>
                                <span className="font-semibold text-[#0D0D0D]">
                                    {isRtl
                                        ? record.companyNameAr || record.companyNameEn
                                        : record.companyNameEn}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t('crm.commercial.deals.form.expectedValueLabel')}
                                </span>
                                <span
                                    className="font-mono font-bold text-[#037F8C]"
                                    dir="ltr"
                                >
                                    {record.expectedValue.toLocaleString()} SAR
                                </span>
                                <span
                                    className="text-[10px] text-[#6E6862] block font-mono"
                                    dir="ltr"
                                >
                                    Weighted: {weightedValue.toLocaleString()} SAR
                                </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t('crm.commercial.deals.form.leadLabel')}
                                </span>
                                <span className="font-semibold text-[#0D0D0D]">
                                    {record.leadCode
                                        ? `${record.leadCode} — ${record.leadTitle || ''}`
                                        : t('crm.commercial.common.noLinkedLead')}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t('crm.commercial.deals.form.assignedRepLabel')}
                                </span>
                                <span className="font-semibold text-[#0D0D0D]">
                                    {isRtl
                                        ? record.assignedEmployeeNameAr ||
                                          record.assignedEmployeeNameEn
                                        : record.assignedEmployeeNameEn}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t(
                                        'crm.commercial.deals.form.expectedCloseDateLabel'
                                    )}
                                </span>
                                <span className="font-mono font-semibold text-[#0D0D0D]" dir="ltr">
                                    {record.expectedCloseDate}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t('crm.commercial.deals.form.sectorLabel')}
                                </span>
                                <span className="font-semibold text-[#0D0D0D]">
                                    {isRtl
                                        ? record.sectorNameAr || record.sectorNameEn
                                        : record.sectorNameEn ||
                                          t('crm.commercial.common.notProvided')}
                                </span>
                            </div>
                        </div>

                        {record.notes && (
                            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#6E6862]">
                                {record.notes}
                            </div>
                        )}
                    </div>

                    {/* Linked Quotations */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-white p-4 space-y-2.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#0D0D0D]">
                            <FileText size={14} className="text-[#037F8C]" />
                            <span>
                                {t('crm.commercial.deals.viewDrawer.linkedQuotations', {
                                    count: dealQuotations.length,
                                })}
                            </span>
                        </div>
                        {dealQuotations.length === 0 ? (
                            <p className="text-xs text-[#6E6862]">
                                {t('crm.commercial.deals.viewDrawer.noQuotations')}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {dealQuotations.map((q) => (
                                    <div
                                        key={q.id}
                                        className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between text-xs"
                                    >
                                        <div>
                                            <span
                                                className="font-mono font-bold text-[#037F8C]"
                                                dir="ltr"
                                            >
                                                {q.code}
                                            </span>{' '}
                                            <span className="font-medium text-[#0D0D0D]">
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
                        )}
                    </div>

                    {/* Linked Contracts */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-white p-4 space-y-2.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#0D0D0D]">
                            <FileCheck2 size={14} className="text-[#037F8C]" />
                            <span>
                                {t('crm.commercial.deals.viewDrawer.linkedContracts', {
                                    count: dealContracts.length,
                                })}
                            </span>
                        </div>
                        {dealContracts.length === 0 ? (
                            <p className="text-xs text-[#6E6862]">
                                {t('crm.commercial.deals.viewDrawer.noContracts')}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {dealContracts.map((c) => (
                                    <div
                                        key={c.id}
                                        className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between text-xs"
                                    >
                                        <div>
                                            <span
                                                className="font-mono font-bold text-[#037F8C]"
                                                dir="ltr"
                                            >
                                                {c.contractNumber}
                                            </span>{' '}
                                            <span className="font-medium text-[#0D0D0D]">
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
                        )}
                    </div>

                    {/* Linked Invoices */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-white p-4 space-y-2.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#0D0D0D]">
                            <Receipt size={14} className="text-[#037F8C]" />
                            <span>
                                {t('crm.commercial.deals.viewDrawer.linkedInvoices', {
                                    count: dealInvoices.length,
                                })}
                            </span>
                        </div>
                        {dealInvoices.length === 0 ? (
                            <p className="text-xs text-[#6E6862]">
                                {t('crm.commercial.deals.viewDrawer.noInvoices')}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {dealInvoices.map((inv) => (
                                    <div
                                        key={inv.id}
                                        className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between text-xs"
                                    >
                                        <div>
                                            <span
                                                className="font-mono font-bold text-[#037F8C]"
                                                dir="ltr"
                                            >
                                                {inv.invoiceNumber}
                                            </span>{' '}
                                            <span className="font-medium text-[#0D0D0D]">
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
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] cursor-pointer"
                    >
                        {t('crm.commercial.common.close')}
                    </button>
                    <button
                        type="button"
                        onClick={() => onEdit(record)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#037F8C] hover:bg-[#233122] text-white text-xs font-semibold cursor-pointer"
                    >
                        <Edit3 size={14} />
                        {t('crm.commercial.common.edit')}
                    </button>
                </div>
            </div>
        </div>
    );
};
