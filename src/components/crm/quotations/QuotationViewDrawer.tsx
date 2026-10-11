import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
    Edit3,
    Send,
    CheckCircle2,
    XCircle,
    FileCheck2,
    Receipt,
    Calculator,
    Building2,
} from 'lucide-react';
import type {
    CrmQuotationRecord,
    CrmQuotationStatus,
} from '../../../schemas/crmSchema';

export interface QuotationViewDrawerProps {
    isOpen: boolean;
    record: CrmQuotationRecord | null;
    isConverting?: boolean;
    onClose: () => void;
    onEdit: (record: CrmQuotationRecord) => void;
    onTransitionStatus: (id: string, status: CrmQuotationStatus) => void;
    onConvertToContract: (quotationId: string) => void;
    onConvertToInvoice: (quotationId: string) => void;
}

export const QuotationViewDrawer: React.FC<QuotationViewDrawerProps> = ({
    isOpen,
    record,
    isConverting = false,
    onClose,
    onEdit,
    onTransitionStatus,
    onConvertToContract,
    onConvertToInvoice,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    if (!isOpen || !record) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quotation-view-drawer-title"
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
                                {record.code}
                            </span>
                            <span
                                className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                                    record.quotationStatus === 'approved'
                                        ? 'bg-[#E9F5EE] text-[#2E6B4E]'
                                        : record.quotationStatus === 'sent'
                                          ? 'bg-[#FDF3E7] text-[#B45309]'
                                          : record.quotationStatus === 'rejected' ||
                                              record.quotationStatus === 'expired'
                                            ? 'bg-[#FCECE9] text-[#A63A3A]'
                                            : 'bg-slate-100 text-slate-700'
                                }`}
                            >
                                {t(
                                    `crm.commercial.quotations.statuses.${record.quotationStatus}`
                                )}
                            </span>
                        </div>
                        <h2
                            id="quotation-view-drawer-title"
                            className="text-lg font-bold text-[#0D0D0D] truncate pt-0.5"
                        >
                            {isRtl
                                ? record.titleAr || record.titleEn
                                : record.titleEn}
                        </h2>
                        <p className="text-xs text-[#6E6862]">
                            {t('crm.commercial.quotations.viewDrawer.subtitle')}
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
                    {/* Workflow & Conversion Actions */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-4 space-y-3">
                        <h3 className="text-xs font-bold text-[#2D3F2C]">
                            {t(
                                'crm.commercial.quotations.viewDrawer.workflowActions'
                            )}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                            {record.quotationStatus === 'draft' && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        onTransitionStatus(record.id, 'sent')
                                    }
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#B45309] hover:bg-[#92400E] text-white text-xs font-semibold cursor-pointer"
                                >
                                    <Send size={13} />
                                    {t(
                                        'crm.commercial.quotations.viewDrawer.submitForApproval'
                                    )}
                                </button>
                            )}

                            {(record.quotationStatus === 'sent' ||
                                record.quotationStatus === 'draft') && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onTransitionStatus(
                                                record.id,
                                                'approved'
                                            )
                                        }
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2E6B4E] hover:bg-[#23533C] text-white text-xs font-semibold cursor-pointer"
                                    >
                                        <CheckCircle2 size={13} />
                                        {t(
                                            'crm.commercial.quotations.viewDrawer.approveQuotation'
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onTransitionStatus(
                                                record.id,
                                                'rejected'
                                            )
                                        }
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#A63A3A]/30 bg-[#FCECE9] text-[#A63A3A] text-xs font-semibold cursor-pointer"
                                    >
                                        <XCircle size={13} />
                                        {t(
                                            'crm.commercial.quotations.viewDrawer.rejectQuotation'
                                        )}
                                    </button>
                                </>
                            )}

                            {record.quotationStatus === 'approved' && (
                                <>
                                    <button
                                        type="button"
                                        disabled={isConverting}
                                        onClick={() =>
                                            onConvertToContract(record.id)
                                        }
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#233122] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                                    >
                                        <FileCheck2 size={14} />
                                        {t(
                                            'crm.commercial.quotations.viewDrawer.convertToContract'
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isConverting}
                                        onClick={() =>
                                            onConvertToInvoice(record.id)
                                        }
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#2D3F2C] bg-white hover:bg-[#FAF8F5] text-[#2D3F2C] text-xs font-semibold cursor-pointer disabled:opacity-50"
                                    >
                                        <Receipt size={14} />
                                        {t(
                                            'crm.commercial.quotations.viewDrawer.convertToInvoice'
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Client & Deal Details */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-white p-4 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#0D0D0D]">
                            <Building2 size={14} className="text-[#2D3F2C]" />
                            <span>
                                {t('crm.commercial.quotations.viewDrawer.title')}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t(
                                        'crm.commercial.quotations.form.companyLabel'
                                    )}
                                </span>
                                <span className="font-semibold text-[#0D0D0D]">
                                    {isRtl
                                        ? record.companyNameAr ||
                                          record.companyNameEn
                                        : record.companyNameEn}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t('crm.commercial.quotations.form.dealLabel')}
                                </span>
                                <span className="font-semibold text-[#0D0D0D]">
                                    {record.dealCode
                                        ? `${record.dealCode} — ${
                                              isRtl
                                                  ? record.dealTitleAr ||
                                                    record.dealTitleEn
                                                  : record.dealTitleEn
                                          }`
                                        : t('crm.commercial.common.noLinkedDeal')}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t(
                                        'crm.commercial.quotations.form.issueDateLabel'
                                    )}{' '}
                                    /{' '}
                                    {t(
                                        'crm.commercial.quotations.form.validUntilLabel'
                                    )}
                                </span>
                                <span
                                    className="font-mono font-semibold text-[#0D0D0D]"
                                    dir="ltr"
                                >
                                    {record.issueDate} → {record.validUntil}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t(
                                        'crm.commercial.quotations.form.assignedRepLabel'
                                    )}
                                </span>
                                <span className="font-semibold text-[#0D0D0D]">
                                    {isRtl
                                        ? record.assignedEmployeeNameAr ||
                                          record.assignedEmployeeNameEn
                                        : record.assignedEmployeeNameEn}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-white p-4 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#0D0D0D]">
                            <Calculator size={14} className="text-[#2D3F2C]" />
                            <span>
                                {t('crm.commercial.common.lineItems.sectionTitle')}{' '}
                                ({record.lineItems.length})
                            </span>
                        </div>
                        <div className="space-y-2">
                            {record.lineItems.map((li, idx) => (
                                <div
                                    key={li.id || idx}
                                    className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] space-y-1.5 text-xs"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-semibold text-[#0D0D0D]">
                                            {idx + 1}.{' '}
                                            {isRtl
                                                ? li.descriptionAr ||
                                                  li.descriptionEn
                                                : li.descriptionEn}
                                        </span>
                                        <span
                                            className="font-mono font-bold text-[#2D3F2C]"
                                            dir="ltr"
                                        >
                                            {li.lineTotal.toLocaleString()} SAR
                                        </span>
                                    </div>
                                    <div
                                        className="flex items-center gap-3 text-[11px] font-mono text-[#6E6862]"
                                        dir="ltr"
                                    >
                                        <span>
                                            Qty: {li.quantity} ×{' '}
                                            {li.unitPrice.toLocaleString()} SAR
                                        </span>
                                        {li.discountPercent > 0 && (
                                            <span>
                                                Disc: {li.discountPercent}% (-
                                                {li.discountAmount.toLocaleString()}{' '}
                                                SAR)
                                            </span>
                                        )}
                                        <span>
                                            VAT {li.taxRate}% (+
                                            {li.taxAmount.toLocaleString()} SAR)
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Totals Summary */}
                        <div className="rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] p-3.5 space-y-1.5 text-xs">
                            <div className="flex justify-between text-[#6E6862]">
                                <span>
                                    {t(
                                        'crm.commercial.common.lineItems.subtotal'
                                    )}
                                </span>
                                <span
                                    className="font-mono font-semibold text-[#0D0D0D]"
                                    dir="ltr"
                                >
                                    {record.subtotal.toLocaleString()} SAR
                                </span>
                            </div>
                            <div className="flex justify-between text-[#6E6862]">
                                <span>
                                    {t(
                                        'crm.commercial.common.lineItems.discountTotal'
                                    )}
                                </span>
                                <span
                                    className="font-mono font-semibold text-[#B45309]"
                                    dir="ltr"
                                >
                                    - {record.discountTotal.toLocaleString()} SAR
                                </span>
                            </div>
                            <div className="flex justify-between text-[#6E6862]">
                                <span>
                                    {t(
                                        'crm.commercial.common.lineItems.taxAmount'
                                    )}
                                </span>
                                <span
                                    className="font-mono font-semibold text-[#0D0D0D]"
                                    dir="ltr"
                                >
                                    + {record.taxAmount.toLocaleString()} SAR
                                </span>
                            </div>
                            <div className="pt-1.5 border-t border-[#E5E0D8] flex justify-between font-bold text-sm text-[#0D0D0D]">
                                <span>
                                    {t(
                                        'crm.commercial.common.lineItems.grandTotal'
                                    )}
                                </span>
                                <span
                                    className="font-mono text-[#2D3F2C]"
                                    dir="ltr"
                                >
                                    {record.grandTotal.toLocaleString()} SAR
                                </span>
                            </div>
                        </div>
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
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2D3F2C] hover:bg-[#233122] text-white text-xs font-semibold cursor-pointer"
                    >
                        <Edit3 size={14} />
                        {t('crm.commercial.common.edit')}
                    </button>
                </div>
            </div>
        </div>
    );
};
